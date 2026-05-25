// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IVenueAdaptor } from "./IVenueAdaptor.sol";
import { LegStatus, GoErrors, GoConstants } from "../shared/GoTypes.sol";

contract GoDFlowRelayAdaptor is Initializable, Ownable2StepUpgradeable, IVenueAdaptor {
    enum RelayStatus { NONE, PENDING_RELAY, EXECUTED, SETTLED }

    struct RelayLeg {
        bytes32 kalshiMarketId;
        bool outcome;
        uint256 hedgeStake;
        uint256 executedOdds;
        RelayStatus status;
        uint256 deadline;
        bool won;
        uint256 payout;
    }

    mapping(bytes32 => RelayLeg) private _relayLegs;
    mapping(address => bool) private _authorisedRelayers;
    uint8 private _relayerCount;

    mapping(bytes32 => bool) public executed;
    mapping(bytes32 => bool) public closed;
    string private _venueId;

    event DFlowRelayRequest(
        bytes32 indexed legId,
        bytes32 indexed kalshiMarketId,
        bool outcome,
        uint256 hedgeStake,
        uint256 minOdds,
        uint256 deadline
    );
    event DFlowPositionConfirmed(bytes32 indexed legId, bytes solanaPositionRef, uint256 executedOdds);
    event DFlowPositionClosed(bytes32 indexed legId);
    event DFlowSettlementReported(bytes32 indexed legId, bool won, uint256 payout);
    event RelayerUpdated(address indexed relayer, bool status);

    modifier onlyRelayer() {
        if (!_authorisedRelayers[msg.sender]) {
            revert GoErrors.NotRelayer(msg.sender);
        }
        _;
    }

    modifier onlyManager() {
        if (msg.sender != owner()) {
            revert GoErrors.Unauthorized(msg.sender);
        }
        _;
    }

    function initialize() external initializer {
        __Ownable_init(msg.sender);
        _venueId = "dflow-kalshi-v1";
    }

    function setRelayer(address relayer, bool status) external onlyOwner {
        if (relayer == address(0)) {
            revert GoErrors.InvalidAddress();
        }
        if (status && !_authorisedRelayers[relayer]) {
            if (_relayerCount >= GoConstants.MAX_RELAYERS) {
                revert GoErrors.MaxCallersExceeded();
            }
            _relayerCount++;
        } else if (!status && _authorisedRelayers[relayer]) {
            if (_relayerCount <= 1) {
                revert GoErrors.MinCallersRequired(_relayerCount);
            }
            _relayerCount--;
        }
        _authorisedRelayers[relayer] = status;
        emit RelayerUpdated(relayer, status);
    }

    function executePosition(
        bytes32 legId,
        bytes32 venueMarketId,
        bool outcome,
        uint256 hedgeStake,
        uint256 minOdds,
        bytes calldata extraData
    ) external override onlyManager returns (bytes memory positionRef) {
        if (hedgeStake == 0) revert GoErrors.ZeroAmount();
        if (_relayLegs[legId].status != RelayStatus.NONE) {
            revert GoErrors.AlreadyInitialized();
        }

        uint256 deadline = block.timestamp + GoConstants.RELAY_TIMEOUT;

        _relayLegs[legId] = RelayLeg({
            kalshiMarketId: venueMarketId,
            outcome: outcome,
            hedgeStake: hedgeStake,
            executedOdds: 0,
            status: RelayStatus.PENDING_RELAY,
            deadline: deadline,
            won: false,
            payout: 0
        });

        emit DFlowRelayRequest(legId, venueMarketId, outcome, hedgeStake, minOdds, deadline);

        return abi.encode(venueMarketId, outcome, uint8(0));
    }

    function confirmExecution(bytes32 legId, bytes calldata solanaTxRef, uint256 executedOdds_) external onlyRelayer {
        RelayLeg storage leg = _relayLegs[legId];
        if (leg.status != RelayStatus.PENDING_RELAY) {
            revert GoErrors.LegNotFound(legId);
        }
        if (block.timestamp > leg.deadline) {
            revert GoErrors.TimelockNotElapsed();
        }

        leg.status = RelayStatus.EXECUTED;
        leg.executedOdds = executedOdds_;

        emit DFlowPositionConfirmed(legId, solanaTxRef, executedOdds_);
    }

    function reportSettlement(bytes32 legId, bool won_, uint256 payout_) external onlyRelayer {
        RelayLeg storage leg = _relayLegs[legId];
        if (leg.status != RelayStatus.EXECUTED) {
            revert GoErrors.LegNotFound(legId);
        }
        leg.status = RelayStatus.SETTLED;
        leg.won = won_;
        leg.payout = payout_;
        emit DFlowSettlementReported(legId, won_, payout_);
    }

    function closePosition(bytes32 legId, bytes memory positionRef) external override onlyManager returns (uint256 amountRecovered) {
        RelayLeg storage leg = _relayLegs[legId];
        if (leg.status == RelayStatus.NONE) {
            revert GoErrors.PositionNotActive(legId);
        }
        if (leg.status == RelayStatus.SETTLED) {
            revert GoErrors.PositionNotActive(legId);
        }

        delete _relayLegs[legId];
        emit DFlowPositionClosed(legId);
        return 0;
    }

    function querySettlement(bytes32 legId, bytes memory) external view override returns (LegStatus status, uint256 payout) {
        RelayLeg storage leg = _relayLegs[legId];
        if (leg.status == RelayStatus.SETTLED) {
            return (leg.won ? LegStatus.WON : LegStatus.LOST, leg.payout);
        }
        return (LegStatus.PENDING, 0);
    }

    function venueId() external view override returns (string memory) {
        return _venueId;
    }

    function requiresRelayer() external pure override returns (bool) {
        return true;
    }

    function isRelayer(address relayer) external view returns (bool) {
        return _authorisedRelayers[relayer];
    }

    function getRelayLeg(bytes32 legId) external view returns (RelayLeg memory) {
        return _relayLegs[legId];
    }

    uint256[49] private __gap;
}
