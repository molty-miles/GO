// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

enum LegStatus {
    PENDING,
    WON,
    LOST,
    DISPUTED,
    TIMEOUT,
    EXECUTION_FAILED
}

enum AccaStatus {
    OPEN,
    PARTIALLY_RESOLVED,
    WON,
    LOST,
    DISPUTED,
    CANCELLED
}

struct LegRequest {
    address adaptor;
    bytes32 venueMarketId;
    bool outcome;
    uint256 quotedOdds;
    uint256 hedgeStake;
    uint256 minOdds;
    bytes extraData;
}

struct Leg {
    bytes32 legId;
    address adaptor;
    bytes32 venueMarketId;
    bytes venuePositionRef;
    uint256 quotedOdds;
    uint256 executedOdds;
    uint256 hedgeStake;
    LegStatus status;
    uint256 resolvedAt;
}

struct Acca {
    bytes32 accaId;
    address user;
    uint256 stake;
    uint256 potentialPayout;
    uint256 combinedOdds;
    uint256 createdAt;
    uint256 expiresAt;
    uint256 settledAt;
    AccaStatus status;
    bytes32[] legIds;
    uint8 legsWon;
    uint8 legsTotal;
}

struct AdaptorInfo {
    string venueId;
    string version;
    bool active;
    uint256 registeredAt;
}

library GoErrors {
    error ZeroAmount();
    error InsufficientBalance();
    error InsufficientAvailableBalance();
    error Unauthorized(address caller);
    error InvalidLegCount(uint256 count);
    error StakeTooLow(uint256 stake);
    error StakeTooHigh(uint256 stake);
    error AdaptorNotRegistered(address adaptor);
    error AccaNotFound(bytes32 accaId);
    error AccaNotActive(bytes32 accaId);
    error LegNotFound(bytes32 legId);
    error LegAlreadyResolved(bytes32 legId);
    error AlreadyReported(bytes32 legId);
    error ResolutionAlreadyFinal(bytes32 legId);
    error ConflictingReports(bytes32 legId);
    error OracleNotRegistered(address oracle);
    error QuorumNotReached(bytes32 legId);
    error DisputeWindowNotElapsed(bytes32 legId);
    error AccaNotDisputed(bytes32 accaId);
    error AccaAlreadySettled(bytes32 accaId);
    error AccaNotExpired(bytes32 accaId);
    error NoExecutedLegs(bytes32 accaId);
    error NotInDisputeState(bytes32 accaId);
    error InvalidResolution();
    error CallerAlreadyAuthorised(address caller);
    error MaxCallersExceeded();
    error MaxOraclesExceeded();
    error ArrayLengthMismatch();
    error TimelockNotElapsed();
    error TransferFailed();
    error InvalidAddress();
    error InvalidPayout();
    error InvalidOdds();
    error AlreadyExpired(uint256 deadline, uint256 current);
    error InvalidHedgeStake();
    error OddsMismatch(uint256 combined, uint256 calculated);
    error LegExecutionFailed(bytes32 legId, address adaptor);
    error NoSuccessfulLegs();
    error PriceSlippageExceeded(uint256 quoted, uint256 actual);
    error NotRelayer(address caller);
    error EmptyString();
    error VenueIdMismatch();
    error IndexOutOfBounds();
    error PositionNotActive(bytes32 legId);
    error AlreadyInitialized();
    error MinCallersRequired(uint256 count);
    error InvariantViolation();
}

library GoConstants {
    uint256 public constant MIN_STAKE = 1e6; // 1 USDC (6 decimals)
    uint256 public constant MAX_STAKE = 10_000_000e6; // 10M USDC
    uint8 public constant MIN_LEGS = 2;
    uint8 public constant MAX_LEGS = 10;
    uint256 public constant RELAY_TIMEOUT = 10 minutes;
    uint256 public constant EXPIRY_GRACE = 7 days;
    uint256 public constant ODDS_PRECISION = 1e18;
    uint256 public constant PLATFORM_WITHDRAW_TIMELOCK = 24 hours;
    uint256 public constant UPGRADE_TIMELOCK = 48 hours;
    uint256 public constant REGISTRY_UPDATE_TIMELOCK = 48 hours;
    uint8 public constant SETTLEMENT_QUORUM = 2;
    uint256 public constant DISPUTE_WINDOW = 2 hours;
    uint8 public constant MAX_AUTHORISED_CALLERS = 3;
    uint8 public constant MAX_ORACLES = 5;
    uint8 public constant MAX_RELAYERS = 3;
}
