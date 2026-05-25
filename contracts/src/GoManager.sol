// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { GoErrors, GoConstants, LegStatus, AccaStatus, LegRequest, Leg, Acca } from "./shared/GoTypes.sol";
import { IVenueAdaptor } from "./adaptors/IVenueAdaptor.sol";
import { GoVault } from "./GoVault.sol";

interface IGoAdaptorRegistry {
    function isRegistered(address adaptor) external view returns (bool);
}

contract GoManager is Initializable, UUPSUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable, Ownable2StepUpgradeable {
    GoVault public vault;
    IGoAdaptorRegistry public adaptorRegistry;
    address public settlementCoordinator;

    mapping(bytes32 => Acca) private _accas;
    mapping(bytes32 => Leg) private _legs;
    mapping(address => bytes32[]) private _userAccas;
    mapping(bytes32 => bytes32) private _legToAcca;
    uint256 private _accaNonce;

    event AccaCreated(bytes32 indexed accaId, address indexed user, uint256 stake, uint256 payout, uint8 legCount);
    event LegResolved(bytes32 indexed legId, bytes32 indexed accaId, LegStatus status);
    event AccaSettled(bytes32 indexed accaId, AccaStatus status, uint256 payout);
    event AccaCancelled(bytes32 indexed accaId, uint256 refundAmount);
    event DisputeResolved(bytes32 indexed accaId, AccaStatus resolution);
    event LegTimedOut(bytes32 indexed legId, bytes32 indexed accaId);
    event LegCreated(bytes32 indexed legId, bytes32 indexed accaId, address indexed adaptor, bytes32 venueMarketId);
    event LegExecutionFailed(bytes32 indexed legId, address indexed adaptor);
    event SettlementCoordinatorUpdated(address indexed coordinator);
    event AdaptorRegistryUpdated(address indexed registry);
    event VaultUpdated(address indexed vault);

    modifier onlyCoordinator() {
        if (msg.sender != settlementCoordinator) revert GoErrors.Unauthorized(msg.sender);
        _;
    }

    function initialize(address vault_, address adaptorRegistry_, address settlementCoordinator_) external initializer {
        if (vault_ == address(0) || adaptorRegistry_ == address(0) || settlementCoordinator_ == address(0))
            revert GoErrors.InvalidAddress();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __Ownable_init(msg.sender);
        vault = GoVault(vault_);
        adaptorRegistry = IGoAdaptorRegistry(adaptorRegistry_);
        settlementCoordinator = settlementCoordinator_;
    }

    function createAcca(
        LegRequest[] calldata legs,
        uint256 stake,
        uint256 potentialPayout,
        uint256 combinedOdds,
        uint256 expiresAt
    ) external nonReentrant whenNotPaused returns (bytes32 accaId) {
        uint8 legCount = uint8(legs.length);
        if (legCount < GoConstants.MIN_LEGS || legCount > GoConstants.MAX_LEGS) revert GoErrors.InvalidLegCount(legCount);
        if (stake < GoConstants.MIN_STAKE) revert GoErrors.StakeTooLow(stake);
        if (stake > GoConstants.MAX_STAKE) revert GoErrors.StakeTooHigh(stake);
        if (potentialPayout == 0) revert GoErrors.InvalidPayout();
        if (combinedOdds == 0) revert GoErrors.InvalidOdds();
        if (expiresAt <= block.timestamp) revert GoErrors.AlreadyExpired(expiresAt, block.timestamp);

        uint256 calculatedOdds = GoConstants.ODDS_PRECISION;
        for (uint8 i = 0; i < legCount; i++) {
            if (legs[i].quotedOdds == 0) revert GoErrors.InvalidOdds();
            if (legs[i].hedgeStake == 0) revert GoErrors.InvalidHedgeStake();
            calculatedOdds = calculatedOdds * legs[i].quotedOdds / GoConstants.ODDS_PRECISION;
        }
        if (combinedOdds != calculatedOdds) revert GoErrors.OddsMismatch(combinedOdds, calculatedOdds);

        accaId = keccak256(abi.encode(msg.sender, _accaNonce++, blockhash(block.number - 1), block.timestamp));

        vault.lockFunds(msg.sender, stake, accaId);

        bytes32[] memory legIds = new bytes32[](legCount);
        uint8 successfulLegs;
        for (uint8 i = 0; i < legCount; i++) {
            LegRequest calldata legReq = legs[i];
            if (!adaptorRegistry.isRegistered(legReq.adaptor)) revert GoErrors.AdaptorNotRegistered(legReq.adaptor);

            bytes32 legId = keccak256(abi.encode(accaId, i));

            try IVenueAdaptor(legReq.adaptor).executePosition(
                legId, legReq.venueMarketId, legReq.outcome, legReq.hedgeStake, legReq.minOdds, legReq.extraData
            ) returns (bytes memory positionRef) {
                _legs[legId] = Leg(legId, legReq.adaptor, legReq.venueMarketId, positionRef, legReq.quotedOdds, legReq.quotedOdds, legReq.hedgeStake, LegStatus.PENDING, 0);
                _legToAcca[legId] = accaId;
                legIds[successfulLegs] = legId;
                successfulLegs++;
                emit LegCreated(legId, accaId, legReq.adaptor, legReq.venueMarketId);
            } catch {
                emit LegExecutionFailed(legId, legReq.adaptor);
            }
        }

        if (successfulLegs == 0) revert GoErrors.NoSuccessfulLegs();

        // Compact legIds array to remove trailing zeros
        assembly { mstore(legIds, successfulLegs) }

        _accas[accaId] = Acca(accaId, msg.sender, stake, potentialPayout, combinedOdds, block.timestamp, expiresAt, 0, AccaStatus.OPEN, legIds, 0, successfulLegs);
        _userAccas[msg.sender].push(accaId);

        emit AccaCreated(accaId, msg.sender, stake, potentialPayout, successfulLegs);
    }

    function reportLegResolution(bytes32 legId, bool won) external onlyCoordinator {
        Leg storage leg = _legs[legId];
        if (leg.legId == bytes32(0)) revert GoErrors.LegNotFound(legId);
        if (leg.status != LegStatus.PENDING) revert GoErrors.LegAlreadyResolved(legId);

        bytes32 accaId = _legToAcca[legId];
        Acca storage acca = _accas[accaId];
        if (acca.status != AccaStatus.OPEN && acca.status != AccaStatus.PARTIALLY_RESOLVED)
            revert GoErrors.AccaNotActive(accaId);

        leg.status = won ? LegStatus.WON : LegStatus.LOST;
        leg.resolvedAt = block.timestamp;

        if (acca.status == AccaStatus.OPEN) acca.status = AccaStatus.PARTIALLY_RESOLVED;
        if (won) acca.legsWon++;

        emit LegResolved(legId, accaId, leg.status);

        if (!won) _settleAcca(accaId, AccaStatus.LOST);
        else if (acca.legsWon == acca.legsTotal) _settleAcca(accaId, AccaStatus.WON);
    }

    function cancelAcca(bytes32 accaId) external nonReentrant {
        Acca storage acca = _accas[accaId];
        if (acca.accaId == bytes32(0)) revert GoErrors.AccaNotFound(accaId);
        if (msg.sender != owner() && msg.sender != acca.user) revert GoErrors.Unauthorized(msg.sender);
        if (msg.sender == acca.user && acca.status != AccaStatus.OPEN) revert GoErrors.AccaNotActive(accaId);
        if (msg.sender == owner() && acca.status != AccaStatus.DISPUTED) revert GoErrors.AccaNotDisputed(accaId);

        _settleCancel(acca, msg.sender == acca.user);
    }

    function triggerTimeout(bytes32 accaId) external whenNotPaused {
        Acca storage acca = _accas[accaId];
        if (acca.accaId == bytes32(0)) revert GoErrors.AccaNotFound(accaId);
        if (acca.status != AccaStatus.OPEN && acca.status != AccaStatus.PARTIALLY_RESOLVED)
            revert GoErrors.AccaNotActive(accaId);
        if (block.timestamp <= acca.expiresAt) revert GoErrors.AccaNotExpired(accaId);

        bool marked;
        for (uint8 i = 0; i < acca.legsTotal; i++) {
            Leg storage leg = _legs[acca.legIds[i]];
            if (leg.status == LegStatus.PENDING) {
                leg.status = LegStatus.TIMEOUT;
                leg.resolvedAt = block.timestamp;
                emit LegTimedOut(acca.legIds[i], accaId);
                marked = true;
            }
        }
        if (!marked) revert GoErrors.InvalidResolution();
        acca.status = AccaStatus.DISPUTED;
    }

    function resolveDispute(bytes32 accaId, AccaStatus resolution) external onlyOwner {
        Acca storage acca = _accas[accaId];
        if (acca.accaId == bytes32(0)) revert GoErrors.AccaNotFound(accaId);
        if (acca.status != AccaStatus.DISPUTED) revert GoErrors.AccaNotDisputed(accaId);
        if (resolution != AccaStatus.WON && resolution != AccaStatus.LOST && resolution != AccaStatus.CANCELLED)
            revert GoErrors.InvalidResolution();

        if (resolution == AccaStatus.WON) _settleAcca(accaId, AccaStatus.WON);
        else if (resolution == AccaStatus.LOST) _settleAcca(accaId, AccaStatus.LOST);
        else _settleCancel(acca, true);

        emit DisputeResolved(accaId, resolution);
    }

    function setSettlementCoordinator(address coordinator_) external onlyOwner {
        if (coordinator_ == address(0)) revert GoErrors.InvalidAddress();
        settlementCoordinator = coordinator_;
        emit SettlementCoordinatorUpdated(coordinator_);
    }

    function setAdaptorRegistry(address registry_) external onlyOwner {
        if (registry_ == address(0)) revert GoErrors.InvalidAddress();
        adaptorRegistry = IGoAdaptorRegistry(registry_);
        emit AdaptorRegistryUpdated(registry_);
    }

    function setVault(address vault_) external onlyOwner {
        if (vault_ == address(0)) revert GoErrors.InvalidAddress();
        vault = GoVault(vault_);
        emit VaultUpdated(vault_);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function getAcca(bytes32 accaId) external view returns (Acca memory) { return _accas[accaId]; }
    function getLeg(bytes32 legId) external view returns (Leg memory) { return _legs[legId]; }
    function getUserAccas(address user) external view returns (bytes32[] memory) { return _userAccas[user]; }

    function _settleAcca(bytes32 accaId, AccaStatus outcome) private {
        Acca storage acca = _accas[accaId];
        if (acca.status == AccaStatus.WON || acca.status == AccaStatus.LOST) revert GoErrors.AccaAlreadySettled(accaId);

        acca.status = outcome;
        acca.settledAt = block.timestamp;

        if (outcome == AccaStatus.WON) {
            vault.releaseFunds(acca.user, acca.stake, acca.potentialPayout, accaId, true);
        } else {
            vault.releaseFunds(acca.user, acca.stake, 0, accaId, false);
        }

        emit AccaSettled(accaId, outcome, outcome == AccaStatus.WON ? acca.potentialPayout : 0);
    }

    function _settleCancel(Acca storage acca, bool refundStake) private {
        if (acca.status == AccaStatus.WON || acca.status == AccaStatus.LOST) revert GoErrors.AccaAlreadySettled(acca.accaId);
        acca.status = AccaStatus.CANCELLED;
        acca.settledAt = block.timestamp;
        vault.releaseFunds(acca.user, acca.stake, 0, acca.accaId, refundStake);
        emit AccaCancelled(acca.accaId, refundStake ? acca.stake : 0);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        if (newImplementation == address(0)) revert GoErrors.InvalidAddress();
    }

    uint256[44] private __gap;
}
