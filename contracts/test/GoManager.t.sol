// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { console2 } from "forge-std/console2.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { GoVault } from "../src/GoVault.sol";
import { GoManager } from "../src/GoManager.sol";
import { GoAdaptorRegistry } from "../src/GoAdaptorRegistry.sol";
import { IVenueAdaptor } from "../src/adaptors/IVenueAdaptor.sol";
import { GoErrors, GoConstants, LegStatus, AccaStatus, Acca, LegRequest } from "../src/shared/GoTypes.sol";

contract MockAdaptor is IVenueAdaptor {
    string public _venueId;
    bool public _requiresRelayer;
    mapping(bytes32 => bool) public executed;
    mapping(bytes32 => bool) public closed;

    constructor(string memory venueId_, bool requiresRelayer_) {
        _venueId = venueId_;
        _requiresRelayer = requiresRelayer_;
    }

    function executePosition(bytes32 legId, bytes32, bool, uint256, uint256, bytes calldata) external override returns (bytes memory) {
        executed[legId] = true;
        return abi.encode(legId, uint8(0));
    }

    function closePosition(bytes32 legId, bytes memory) external override returns (uint256) {
        closed[legId] = true;
        return 0;
    }

    function querySettlement(bytes32, bytes memory) external view override returns (LegStatus, uint256) {
        return (LegStatus.PENDING, 0);
    }

    function venueId() external view override returns (string memory) { return _venueId; }
    function requiresRelayer() external view override returns (bool) { return _requiresRelayer; }
}

contract MockUSDC {
    string public name = "MockUSDC";
    string public symbol = "mUSDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract GoManagerTest is Test {
    GoVault public vault;
    GoManager public manager;
    GoAdaptorRegistry public registry;
    MockAdaptor public limitlessAdaptor;
    MockAdaptor public polymarketAdaptor;
    MockUSDC public usdc;

    address public owner;
    address public user;
    address public coordinator;

    function setUp() public {
        owner = address(0x1);
        user = address(0x2);
        coordinator = address(0x5);

        vm.startPrank(owner);

        usdc = new MockUSDC();
        usdc.mint(user, 100_000e6);

        limitlessAdaptor = new MockAdaptor("limitless-v1", false);
        polymarketAdaptor = new MockAdaptor("polymarket-v2", true);

        GoAdaptorRegistry registryImpl = new GoAdaptorRegistry();
        registryImpl.initialize();
        registry = GoAdaptorRegistry(address(registryImpl));
        registry.registerAdaptor(address(limitlessAdaptor), "limitless-v1", "1.0.0");
        registry.registerAdaptor(address(polymarketAdaptor), "polymarket-v2", "1.0.0");

        GoVault vaultImpl = new GoVault();
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImpl), abi.encodeWithSelector(GoVault.initialize.selector, address(usdc)));
        vault = GoVault(address(vaultProxy));

        GoManager managerImpl = new GoManager();
        ERC1967Proxy managerProxy = new ERC1967Proxy(address(managerImpl), abi.encodeWithSelector(GoManager.initialize.selector, address(vault), address(registry), coordinator));
        manager = GoManager(address(managerProxy));

        vault.setAuthorisedCaller(address(manager), true);

        vm.stopPrank();

        vm.label(owner, "Owner");
        vm.label(user, "User");
        vm.label(coordinator, "Coordinator");
    }

    function _createLegRequests(uint8 count) private view returns (LegRequest[] memory) {
        LegRequest[] memory legs = new LegRequest[](count);
        for (uint8 i = 0; i < count; i++) {
            legs[i] = LegRequest({
                adaptor: address(limitlessAdaptor),
                venueMarketId: keccak256(abi.encodePacked("market", i)),
                outcome: true,
                quotedOdds: 0.6e18,
                hedgeStake: 100e6,
                minOdds: 0.5e18,
                extraData: ""
            });
        }
        return legs;
    }

    function _depositAndCreateAcca(uint8 legCount) private returns (bytes32) {
        LegRequest[] memory legs = _createLegRequests(legCount);

        vm.prank(user);
        usdc.approve(address(vault), 10000e6);

        vm.prank(user);
        vault.deposit(10000e6);

        uint256 stake = 500e6;
        uint256 payout = 3000e6;
        uint256 combinedOdds = 0.165e18;
        uint256 expiresAt = block.timestamp + 30 days;

        vm.prank(user);
        return manager.createAcca(legs, stake, payout, combinedOdds, expiresAt);
    }

    function test_CreateAcca() public {
        bytes32 accaId = _depositAndCreateAcca(3);

        Acca memory acca = manager.getAcca(accaId);
        assertEq(acca.accaId, accaId);
        assertEq(acca.user, user);
        assertEq(acca.stake, 500e6);
        assertEq(acca.potentialPayout, 3000e6);
        assertEq(uint8(acca.status), uint8(AccaStatus.OPEN));
        assertEq(acca.legsTotal, 3);
        assertEq(acca.legsWon, 0);
    }

    function test_CreateAccaInvalidLegCount() public {
        LegRequest[] memory legs = _createLegRequests(1);
        vm.startPrank(user);
        usdc.approve(address(vault), 10000e6);
        vault.deposit(10000e6);
        vm.expectRevert(abi.encodeWithSelector(GoErrors.InvalidLegCount.selector, 1));
        manager.createAcca(legs, 500e6, 3000e6, 0.165e18, block.timestamp + 30 days);
        vm.stopPrank();
    }

    function test_ReportLegWins() public {
        bytes32 accaId = _depositAndCreateAcca(2);
        bytes32[] memory legIds = manager.getAccaLegIds(accaId);

        vm.prank(coordinator);
        manager.reportLegResolution(legIds[0], true);

        vm.prank(coordinator);
        manager.reportLegResolution(legIds[1], true);

        Acca memory acca = manager.getAcca(accaId);
        assertEq(uint8(acca.status), uint8(AccaStatus.WON));

        (uint256 total, , ) = vault.userBalance(user);
        assertGt(total, 10000e6);
    }

    function test_ReportLegLosesImmediatelySettles() public {
        bytes32 accaId = _depositAndCreateAcca(2);
        bytes32[] memory legIds = manager.getAccaLegIds(accaId);

        vm.prank(coordinator);
        manager.reportLegResolution(legIds[0], false);

        Acca memory acca = manager.getAcca(accaId);
        assertEq(uint8(acca.status), uint8(AccaStatus.LOST));
    }

    function test_CannotDoubleResolveLeg() public {
        bytes32 accaId = _depositAndCreateAcca(2);
        bytes32[] memory legIds = manager.getAccaLegIds(accaId);

        vm.prank(coordinator);
        manager.reportLegResolution(legIds[0], true);

        vm.prank(coordinator);
        vm.expectRevert(abi.encodeWithSelector(GoErrors.LegAlreadyResolved.selector, legIds[0]));
        manager.reportLegResolution(legIds[0], true);
    }

    function test_UserCancelAcca() public {
        bytes32 accaId = _depositAndCreateAcca(2);
        (uint256 beforeTotal, , ) = vault.userBalance(user);

        vm.prank(user);
        manager.cancelAcca(accaId);

        Acca memory acca = manager.getAcca(accaId);
        assertEq(uint8(acca.status), uint8(AccaStatus.CANCELLED));

        (uint256 afterTotal, , ) = vault.userBalance(user);
        assertEq(afterTotal, beforeTotal);
    }

    function test_TimeoutAndDisputeResolveWon() public {
        bytes32 accaId = _depositAndCreateAcca(3);

        vm.warp(block.timestamp + 31 days);

        vm.prank(owner);
        manager.triggerTimeout(accaId);

        Acca memory acca = manager.getAcca(accaId);
        assertEq(uint8(acca.status), uint8(AccaStatus.DISPUTED));

        vm.prank(owner);
        manager.resolveDispute(accaId, AccaStatus.WON);

        acca = manager.getAcca(accaId);
        assertEq(uint8(acca.status), uint8(AccaStatus.WON));
    }

    function test_OnlyCoordinatorCanReport() public {
        bytes32 accaId = _depositAndCreateAcca(2);
        bytes32[] memory legIds = manager.getAccaLegIds(accaId);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(GoErrors.Unauthorized.selector, user));
        manager.reportLegResolution(legIds[0], true);
    }

    function test_FullAccaLifecycle() public {
        bytes32 accaId = _depositAndCreateAcca(3);
        bytes32[] memory legIds = manager.getAccaLegIds(accaId);

        vm.startPrank(coordinator);
        manager.reportLegResolution(legIds[0], true);
        manager.reportLegResolution(legIds[1], true);
        manager.reportLegResolution(legIds[2], true);
        vm.stopPrank();

        Acca memory acca = manager.getAcca(accaId);
        assertEq(uint8(acca.status), uint8(AccaStatus.WON));
    }

    function test_OverroundOffChain() public {
        LegRequest[] memory legs = _createLegRequests(3);

        vm.startPrank(user);
        usdc.approve(address(vault), 10000e6);
        vault.deposit(10000e6);

        bytes32 accaId = manager.createAcca(legs, 100e6, 673e6, 0.1485e18, block.timestamp + 30 days);
        vm.stopPrank();

        Acca memory acca = manager.getAcca(accaId);
        assertEq(acca.potentialPayout, 673e6);
        assertEq(acca.combinedOdds, 0.1485e18);
    }

    function test_OwnerResolveDisputedAsLost() public {
        bytes32 accaId = _depositAndCreateAcca(2);

        vm.warp(block.timestamp + 31 days);
        vm.prank(owner);
        manager.triggerTimeout(accaId);

        vm.prank(owner);
        manager.resolveDispute(accaId, AccaStatus.LOST);

        Acca memory acca = manager.getAcca(accaId);
        assertEq(uint8(acca.status), uint8(AccaStatus.LOST));
    }

    function test_OwnerSetCoordinator() public {
        address newCoord = address(0x99);
        vm.prank(owner);
        manager.setSettlementCoordinator(newCoord);
        assertEq(manager.settlementCoordinator(), newCoord);
    }

    function test_NonOwnerCannotSetCoordinator() public {
        vm.prank(user);
        vm.expectRevert();
        manager.setSettlementCoordinator(user);
    }
}
