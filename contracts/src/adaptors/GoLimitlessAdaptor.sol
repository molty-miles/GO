// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { IVenueAdaptor } from "./IVenueAdaptor.sol";
import { LegStatus, GoErrors, GoConstants } from "../shared/GoTypes.sol";

interface ILimitlessExchange {
    function buyShares(bytes32 marketId, bool outcome, uint256 amount, uint256 minShares) external returns (uint256 sharesReceived);
    function sellShares(bytes32 marketId, bool outcome, uint256 shares) external returns (uint256 amountReceived);
    function getShares(address user, bytes32 marketId, bool outcome) external view returns (uint256);
}

interface ILimitlessOracle {
    function getMarketOutcome(bytes32 marketId) external view returns (bool resolved, bool outcome);
}

contract GoLimitlessAdaptor is Initializable, ReentrancyGuardUpgradeable, Ownable2StepUpgradeable, IVenueAdaptor {
    using SafeERC20 for IERC20;

    IERC20 public USDC;
    ILimitlessExchange public limitlessExchange;
    ILimitlessOracle public limitlessOracle;

    mapping(bytes32 => Position) private _positions;

    struct Position {
        bytes32 marketId;
        bool outcome;
        uint256 shares;
        uint256 hedgeStake;
        bool active;
        uint256 odds;
    }

    event PositionOpened(bytes32 indexed legId, bytes32 indexed marketId, bool outcome, uint256 shares, uint256 hedgeStake, uint256 odds);
    event PositionClosed(bytes32 indexed legId, uint256 amountRecovered);
    event HedgeFundsDeposited(uint256 amount);

    modifier onlyManager() {
        if (msg.sender != owner()) {
            revert GoErrors.Unauthorized(msg.sender);
        }
        _;
    }

    function initialize(address usdc_, address exchange_, address oracle_) external initializer {
        if (usdc_ == address(0) || exchange_ == address(0) || oracle_ == address(0)) {
            revert GoErrors.InvalidAddress();
        }
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);
        USDC = IERC20(usdc_);
        limitlessExchange = ILimitlessExchange(exchange_);
        limitlessOracle = ILimitlessOracle(oracle_);
    }

    function depositHedgeFunds(uint256 amount) external nonReentrant onlyManager {
        if (amount == 0) revert GoErrors.ZeroAmount();
        USDC.safeTransferFrom(msg.sender, address(this), amount);
        emit HedgeFundsDeposited(amount);
    }

    function executePosition(
        bytes32 legId,
        bytes32 venueMarketId,
        bool outcome,
        uint256 hedgeStake,
        uint256 minOdds,
        bytes calldata extraData
    ) external override onlyManager nonReentrant returns (bytes memory positionRef) {
        if (hedgeStake == 0) revert GoErrors.ZeroAmount();
        if (USDC.balanceOf(address(this)) < hedgeStake) revert GoErrors.InsufficientBalance();

        // CEI: Initialize position state before external calls
        _positions[legId] = Position({
            marketId: venueMarketId,
            outcome: outcome,
            shares: 0,
            hedgeStake: hedgeStake,
            active: false,
            odds: 0
        });

        USDC.forceApprove(address(limitlessExchange), hedgeStake);

        uint256 sharesReceived = limitlessExchange.buyShares(venueMarketId, outcome, hedgeStake, minOdds);
        if (sharesReceived == 0) revert GoErrors.TransferFailed();

        uint256 effectiveOdds = sharesReceived * GoConstants.ODDS_PRECISION / hedgeStake;
        _positions[legId].shares = sharesReceived;
        _positions[legId].active = true;
        _positions[legId].odds = effectiveOdds;

        positionRef = abi.encode(venueMarketId, outcome, sharesReceived);

        emit PositionOpened(legId, venueMarketId, outcome, sharesReceived, hedgeStake, effectiveOdds);
    }

    function closePosition(bytes32 legId, bytes memory positionRef) external override onlyManager nonReentrant returns (uint256 amountRecovered) {
        Position storage pos = _positions[legId];
        if (!pos.active) {
            revert GoErrors.PositionNotActive(legId);
        }

        (bytes32 marketId, bool outcome, uint256 shares) = abi.decode(positionRef, (bytes32, bool, uint256));

        USDC.forceApprove(address(limitlessExchange), 0);

        amountRecovered = limitlessExchange.sellShares(marketId, outcome, shares);

        pos.active = false;
        delete _positions[legId];

        if (amountRecovered > 0) {
            USDC.safeTransfer(owner(), amountRecovered);
        }

        emit PositionClosed(legId, amountRecovered);
    }

    function querySettlement(bytes32 legId, bytes memory positionRef) external view override returns (LegStatus status, uint256 payout) {
        (bytes32 marketId, bool outcome, uint256 shares) = abi.decode(positionRef, (bytes32, bool, uint256));

        (bool resolved, bool marketOutcome) = limitlessOracle.getMarketOutcome(marketId);

        if (!resolved) {
            return (LegStatus.PENDING, 0);
        }

        bool won = (marketOutcome == outcome);
        if (won) {
            payout = _estimatePayout(shares);
        }

        return (won ? LegStatus.WON : LegStatus.LOST, payout);
    }

    function venueId() external pure override returns (string memory) {
        return "limitless-v1";
    }

    function requiresRelayer() external pure override returns (bool) {
        return false;
    }

    function _estimatePayout(uint256 shares) private pure returns (uint256) {
        return shares;
    }

    uint256[47] private __gap;
}
