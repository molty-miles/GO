// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { console2 } from "forge-std/console2.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { GoVault } from "../src/GoVault.sol";
import { GoErrors } from "../src/shared/GoTypes.sol";

contract MockUSDC is IERC20 {
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

contract GoVaultTest is Test {
    GoVault public vault;
    MockUSDC public usdc;
    address public owner;
    address public user;
    address public manager;
    address public attacker;

    function setUp() public {
        owner = address(0x1);
        user = address(0x2);
        manager = address(0x3);
        attacker = address(0x4);

        vm.startPrank(owner);

        usdc = new MockUSDC();
        usdc.mint(user, 100_000_000e6);
        usdc.mint(attacker, 100_000e6);

        GoVault impl = new GoVault();
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), abi.encodeWithSelector(GoVault.initialize.selector, address(usdc)));
        vault = GoVault(address(proxy));

        vault.setAuthorisedCaller(manager, true);

        vm.stopPrank();

        vm.label(owner, "Owner");
        vm.label(user, "User");
        vm.label(manager, "Manager");
        vm.label(attacker, "Attacker");
    }

    function test_Deposit() public {
        vm.prank(user);
        usdc.approve(address(vault), 1000e6);

        vm.prank(user);
        vault.deposit(1000e6);

        (uint256 total, uint256 locked, uint256 available) = vault.userBalance(user);
        assertEq(total, 1000e6, "total balance wrong");
        assertEq(locked, 0, "locked should be 0");
        assertEq(available, 1000e6, "available should equal total");
    }

    function test_DepositZeroAmount() public {
        vm.prank(user);
        usdc.approve(address(vault), 0);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(GoErrors.ZeroAmount.selector));
        vault.deposit(0);
    }

    function test_DepositWhenPaused() public {
        vm.prank(owner);
        vault.pause();

        vm.prank(user);
        usdc.approve(address(vault), 100e6);

        vm.prank(user);
        vm.expectRevert();
        vault.deposit(100e6);
    }

    function test_Withdraw() public {
        vm.startPrank(user);
        usdc.approve(address(vault), 1000e6);
        vault.deposit(1000e6);

        vault.withdraw(500e6);
        vm.stopPrank();

        (uint256 total, , uint256 available) = vault.userBalance(user);
        assertEq(total, 500e6, "remaining balance wrong");
        assertEq(available, 500e6, "available balance wrong");
    }

    function test_WithdrawInsufficientBalance() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(GoErrors.InsufficientAvailableBalance.selector));
        vault.withdraw(100e6);
    }

    function test_WithdrawWhenPaused() public {
        vm.startPrank(user);
        usdc.approve(address(vault), 1000e6);
        vault.deposit(1000e6);
        vm.stopPrank();

        vm.prank(owner);
        vault.pause();

        vm.prank(user);
        vault.withdraw(100e6);

        (uint256 total, , ) = vault.userBalance(user);
        assertEq(total, 900e6, "withdraw should work even when paused");
    }

    function test_LockAndReleaseWin() public {
        vm.startPrank(user);
        usdc.approve(address(vault), 1000e6);
        vault.deposit(1000e6);
        vm.stopPrank();

        bytes32 accaId = keccak256("acca1");

        vm.prank(manager);
        vault.lockFunds(user, 200e6, accaId);

        (uint256 total, uint256 locked, uint256 available) = vault.userBalance(user);
        assertEq(total, 1000e6, "total unchanged");
        assertEq(locked, 200e6, "locked amount wrong");
        assertEq(available, 800e6, "available should exclude locked");

        vm.prank(manager);
        vault.releaseFunds(user, 200e6, 500e6, accaId, true);

        (total, locked, available) = vault.userBalance(user);
        assertEq(total, 1500e6, "total should include payout");
        assertEq(locked, 0, "locked cleared");
        assertEq(available, 1500e6, "all available");
    }

    function test_LockAndReleaseLoss() public {
        vm.startPrank(user);
        usdc.approve(address(vault), 1000e6);
        vault.deposit(1000e6);
        vm.stopPrank();

        bytes32 accaId = keccak256("acca1");

        vm.prank(manager);
        vault.lockFunds(user, 200e6, accaId);

        vm.prank(manager);
        vault.releaseFunds(user, 200e6, 0, accaId, false);

        (uint256 total, uint256 locked, ) = vault.userBalance(user);
        assertEq(total, 800e6, "user forfeited stake");
        assertEq(locked, 0, "locked cleared");
        assertEq(vault.platformRevenue(), 200e6, "platform earned stake");
    }

    function test_UnauthorizedCallerCannotLock() public {
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(GoErrors.Unauthorized.selector, attacker));
        vault.lockFunds(address(0), 0, bytes32(0));
    }

    function test_OnlyOwnerCanSetCaller() public {
        vm.prank(attacker);
        vm.expectRevert();
        vault.setAuthorisedCaller(attacker, true);
    }

    function test_MaxAuthorisedCallers() public {
        address caller2 = address(0x10);
        address caller3 = address(0x11);
        address caller4 = address(0x12);

        vm.startPrank(owner);
        vault.setAuthorisedCaller(caller2, true);
        vault.setAuthorisedCaller(caller3, true);

        vm.expectRevert(abi.encodeWithSelector(GoErrors.MaxCallersExceeded.selector));
        vault.setAuthorisedCaller(caller4, true);
        vm.stopPrank();
    }

    function test_PlatformWithdrawTimelock() public {
        vm.startPrank(user);
        usdc.approve(address(vault), 1000e6);
        vault.deposit(1000e6);
        vm.stopPrank();

        bytes32 accaId = keccak256("acca1");
        vm.prank(manager);
        vault.lockFunds(user, 200e6, accaId);
        vm.prank(manager);
        vault.releaseFunds(user, 200e6, 0, accaId, false);

        assertEq(vault.platformRevenue(), 200e6);

        vm.prank(owner);
        vault.requestPlatformWithdraw(100e6, owner);

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(GoErrors.TimelockNotElapsed.selector));
        vault.executePlatformWithdraw();

        vm.warp(block.timestamp + 24 hours + 1);

        vm.prank(owner);
        vault.executePlatformWithdraw();

        assertEq(vault.platformRevenue(), 100e6);
    }

    function test_InvariantCheck() public {
        vm.startPrank(user);
        usdc.approve(address(vault), 1000e6);
        vault.deposit(1000e6);
        vm.stopPrank();

        assertTrue(vault.invariantCheck());
    }
}
