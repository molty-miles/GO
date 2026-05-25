// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IVenueAdaptor } from "./IVenueAdaptor.sol";
import { LegStatus, GoErrors } from "../shared/GoTypes.sol";

interface ICtfExchange {
    function swapExactAmountIn(
        address conditionalTokens,
        address collateralToken,
        bytes32 conditionId,
        uint256 amount,
        uint256 minAmountOut
    ) external returns (uint256 amountOut);
}

interface IConditionalTokens {
    function getOutcomeSlotCount(bytes32 conditionId) external view returns (uint256);
    function balanceOf(address account, bytes32 tokenId) external view returns (uint256);
}

interface IUmaOptimisticOracle {
    function hasPrice(bytes32 identifier, uint256 timestamp, bytes memory ancillaryData) external view returns (bool);
    function getRequest(
        address requester,
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData
    ) external view returns (bool resolved, bytes memory resolvedPrice);
}

contract GoPolymarketAdaptor is Initializable, Ownable2StepUpgradeable, IVenueAdaptor {
    using SafeERC20 for IERC20;

    struct RelayState {
        bytes32 conditionId;
        uint256 indexSet;
        bool outcome;
        uint256 hedgeStake;
        bool executed;
        bool settled;
        uint256 executedOdds;
        uint256 payout;
        bool won;
    }

    IERC20 public USDC;
    ICtfExchange public ctfExchange;
    IConditionalTokens public conditionalTokens;
    IUmaOptimisticOracle public umaOracle;

    mapping(bytes32 => RelayState) public relayStates;
    mapping(bytes32 => bytes) public positionRefs;

    address public umaRequester;

    event PolymarketRelayRequest(
        bytes32 indexed legId,
        bytes32 indexed conditionId,
        uint256 indexSet,
        bool outcome,
        uint256 hedgeStake,
        uint256 minOdds,
        uint256 deadline
    );
    event PolymarketExecutionConfirmed(bytes32 indexed legId, bytes solanaPositionRef, uint256 executedOdds);
    event PolymarketSettlementReceived(bytes32 indexed legId, bool won, uint256 payout);
    event PolymarketPositionRecovered(bytes32 indexed legId);

    modifier onlyManager() {
        if (msg.sender != owner()) {
            revert GoErrors.Unauthorized(msg.sender);
        }
        _;
    }

    modifier onlyRelayer() {
        if (msg.sender != owner()) {
            revert GoErrors.Unauthorized(msg.sender);
        }
        _;
    }

    function initialize(address usdc_, address ctfExchange_, address conditionalTokens_, address umaOracle_, address umaRequester_) external initializer {
        if (usdc_ == address(0) || ctfExchange_ == address(0) || conditionalTokens_ == address(0) || umaOracle_ == address(0) || umaRequester_ == address(0)) {
            revert GoErrors.InvalidAddress();
        }
        __Ownable_init(msg.sender);
        USDC = IERC20(usdc_);
        ctfExchange = ICtfExchange(ctfExchange_);
        conditionalTokens = IConditionalTokens(conditionalTokens_);
        umaOracle = IUmaOptimisticOracle(umaOracle_);
        umaRequester = umaRequester_;
    }

    function executePosition(
        bytes32 legId,
        bytes32 venueMarketId,
        bool outcome,
        uint256 hedgeStake,
        uint256 minOdds,
        bytes calldata extraData
    ) external override onlyManager returns (bytes memory positionRef) {
        (bytes32 conditionId, uint256 indexSet) = abi.decode(extraData, (bytes32, uint256));

        if (relayStates[legId].hedgeStake != 0) {
            revert GoErrors.AlreadyInitialized();
        }

        relayStates[legId] = RelayState({
            conditionId: conditionId,
            indexSet: indexSet,
            outcome: outcome,
            hedgeStake: hedgeStake,
            executed: false,
            settled: false,
            executedOdds: 0,
            payout: 0,
            won: false
        });

        emit PolymarketRelayRequest(
            legId,
            conditionId,
            indexSet,
            outcome,
            hedgeStake,
            minOdds,
            block.timestamp + 30 minutes
        );

        positionRef = abi.encode(conditionId, indexSet, outcome, uint8(0));
        positionRefs[legId] = positionRef;
    }

    function confirmExecution(
        bytes32 legId,
        bytes calldata solanaTxRef,
        uint256 executedOdds_,
        bool won_,
        uint256 payout_
    ) external onlyRelayer {
        RelayState storage state = relayStates[legId];
        if (state.hedgeStake == 0) revert GoErrors.LegNotFound(legId);
        if (state.executed) revert GoErrors.LegAlreadyResolved(legId);

        state.executed = true;
        state.executedOdds = executedOdds_;
        state.won = won_;
        state.payout = payout_;
        emit PolymarketExecutionConfirmed(legId, solanaTxRef, executedOdds_);
    }

    function closePosition(bytes32 legId, bytes memory) external override onlyManager returns (uint256 amountRecovered) {
        RelayState storage state = relayStates[legId];
        if (state.hedgeStake == 0) revert GoErrors.PositionNotActive(legId);
        if (!state.executed) {
            delete relayStates[legId];
            emit PolymarketPositionRecovered(legId);
            return 0;
        }

        if (state.settled) revert GoErrors.PositionNotActive(legId);
        state.executed = false;
        state.settled = true;
        delete relayStates[legId];

        return 0;
    }

    function querySettlement(bytes32 legId, bytes memory positionRef) external view override returns (LegStatus status, uint256 payout) {
        RelayState storage state = relayStates[legId];

        // If relay has confirmed with result, return stored data
        if (state.executed) {
            return (state.won ? LegStatus.WON : LegStatus.LOST, state.payout);
        }

        (bytes32 conditionId, , bool outcome, ) = abi.decode(positionRef, (bytes32, uint256, bool, uint8));

        (, bytes memory resolvedPrice) = umaOracle.getRequest(
            umaRequester,
            "YES_OR_NO",
            0,
            abi.encode(conditionId)
        );

        if (resolvedPrice.length == 0) {
            return (LegStatus.PENDING, 0);
        }

        bool marketOutcome = abi.decode(resolvedPrice, (bool));
        bool won = (marketOutcome == outcome);

        return (won ? LegStatus.WON : LegStatus.LOST, 0);
    }

    function venueId() external pure override returns (string memory) {
        return "polymarket-v2";
    }

    function requiresRelayer() external pure override returns (bool) {
        return true;
    }

    uint256[46] private __gap;
}
