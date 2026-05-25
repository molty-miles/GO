// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { console2 } from "forge-std/console2.sol";
import { GoAdaptorRegistry } from "../src/GoAdaptorRegistry.sol";
import { GoErrors, AdaptorInfo } from "../src/shared/GoTypes.sol";
import { IVenueAdaptor } from "../src/adaptors/IVenueAdaptor.sol";
import { LegStatus } from "../src/shared/GoTypes.sol";

contract MockAdaptor is IVenueAdaptor {
    string private _venueId;
    bool private _relayer;

    constructor(string memory venueId_, bool relayer_) {
        _venueId = venueId_;
        _relayer = relayer_;
    }

    function executePosition(bytes32, bytes32, bool, uint256, uint256, bytes calldata) external override returns (bytes memory) {
        return "";
    }
    function closePosition(bytes32, bytes memory) external override returns (uint256) { return 0; }
    function querySettlement(bytes32, bytes memory) external view override returns (LegStatus, uint256) { return (LegStatus.PENDING, 0); }
    function venueId() external view override returns (string memory) { return _venueId; }
    function requiresRelayer() external view override returns (bool) { return _relayer; }
}

contract GoAdaptorRegistryTest is Test {
    GoAdaptorRegistry public registry;
    MockAdaptor public adaptor;
    address public owner;
    address public attacker;

    function setUp() public {
        owner = address(0x1);
        attacker = address(0x99);

        vm.startPrank(owner);
        registry = new GoAdaptorRegistry();
        registry.initialize();
        vm.stopPrank();

        adaptor = new MockAdaptor("test-venue-v1", false);
    }

    function test_RegisterAdaptor() public {
        vm.prank(owner);
        registry.registerAdaptor(address(adaptor), "test-venue-v1", "1.0.0");

        assertTrue(registry.isRegistered(address(adaptor)), "should be registered");
        assertEq(registry.getAdaptor("test-venue-v1"), address(adaptor), "venue lookup");
    }

    function test_DeprecateAdaptor() public {
        vm.startPrank(owner);
        registry.registerAdaptor(address(adaptor), "test-venue-v1", "1.0.0");
        assertTrue(registry.isRegistered(address(adaptor)));

        registry.deprecateAdaptor(address(adaptor));
        assertFalse(registry.isRegistered(address(adaptor)));
        vm.stopPrank();
    }

    function test_ReactivateAdaptor() public {
        vm.startPrank(owner);
        registry.registerAdaptor(address(adaptor), "test-venue-v1", "1.0.0");
        registry.deprecateAdaptor(address(adaptor));
        registry.reactivateAdaptor(address(adaptor));
        assertTrue(registry.isRegistered(address(adaptor)));
        vm.stopPrank();
    }

    function test_OnlyOwnerCanRegister() public {
        vm.prank(attacker);
        vm.expectRevert();
        registry.registerAdaptor(address(adaptor), "test", "1.0.0");
    }

    function test_AdaptorInfo() public {
        vm.prank(owner);
        registry.registerAdaptor(address(adaptor), "test-venue-v1", "1.0.0");

        AdaptorInfo memory info = registry.getAdaptorInfo(address(adaptor));
        assertEq(info.venueId, "test-venue-v1");
        assertEq(info.version, "1.0.0");
        assertTrue(info.active);
        assertGt(info.registeredAt, 0);
    }
}
