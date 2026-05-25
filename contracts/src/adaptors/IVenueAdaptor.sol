// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { LegStatus } from "../shared/GoTypes.sol";

interface IVenueAdaptor {
    function executePosition(
        bytes32 legId,
        bytes32 venueMarketId,
        bool outcome,
        uint256 hedgeStake,
        uint256 minOdds,
        bytes calldata extraData
    ) external returns (bytes memory positionRef);

    function closePosition(
        bytes32 legId,
        bytes memory positionRef
    ) external returns (uint256 amountRecovered);

    function querySettlement(
        bytes32 legId,
        bytes memory positionRef
    ) external view returns (LegStatus status, uint256 payout);

    function venueId() external view returns (string memory);

    function requiresRelayer() external view returns (bool);
}
