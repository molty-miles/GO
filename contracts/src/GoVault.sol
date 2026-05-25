// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { GoErrors, GoConstants } from "./shared/GoTypes.sol";

contract GoVault is Initializable, UUPSUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable, Ownable2StepUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public USDC;

    mapping(address => uint256) private _userBalances;
    mapping(address => uint256) private _lockedBalances;
    mapping(address => bool) private _authorisedCallers;
    uint256 private _platformRevenue;
    uint256 private _totalUserBalance;
    uint256 private _totalLockedBalance;
    uint256 private _lastPlatformWithdrawRequest;
    uint256 private _pendingPlatformWithdrawAmount;
    address private _pendingPlatformWithdrawTo;

    uint8 private _callerCount;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event FundsLocked(address indexed user, uint256 amount, bytes32 indexed accaId);
    event FundsReleased(address indexed user, uint256 stakeAmount, uint256 payoutAmount, bytes32 indexed accaId, bool won);
    event PlatformWithdrawRequested(address indexed to, uint256 amount, uint256 executeAt);
    event PlatformWithdrawn(address indexed to, uint256 amount);
    event CallerUpdated(address indexed caller, bool status);

    modifier onlyAuthorised() {
        if (!_authorisedCallers[msg.sender]) {
            revert GoErrors.Unauthorized(msg.sender);
        }
        _;
    }

    function initialize(address usdc) external initializer {
        if (usdc == address(0)) {
            revert GoErrors.InvalidAddress();
        }
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __Ownable_init(msg.sender);
        USDC = IERC20(usdc);
    }

    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) {
            revert GoErrors.ZeroAmount();
        }
        _userBalances[msg.sender] += amount;
        _totalUserBalance += amount;
        USDC.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert GoErrors.ZeroAmount();
        }
        uint256 available = _availableBalance(msg.sender);
        if (amount > available) {
            revert GoErrors.InsufficientAvailableBalance();
        }
        _userBalances[msg.sender] -= amount;
        _totalUserBalance -= amount;
        USDC.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function lockFunds(address user, uint256 amount, bytes32 accaId) external onlyAuthorised {
        uint256 available = _availableBalance(user);
        if (amount > available) {
            revert GoErrors.InsufficientAvailableBalance();
        }
        _lockedBalances[user] += amount;
        _totalLockedBalance += amount;
        emit FundsLocked(user, amount, accaId);
    }

    function releaseFunds(
        address user,
        uint256 stakeAmount,
        uint256 payoutAmount,
        bytes32 accaId,
        bool won
    ) external onlyAuthorised nonReentrant {
        if (_lockedBalances[user] < stakeAmount) {
            revert GoErrors.InsufficientBalance();
        }
        _lockedBalances[user] -= stakeAmount;
        _totalLockedBalance -= stakeAmount;
        if (won) {
            _userBalances[user] += payoutAmount;
            _totalUserBalance += payoutAmount;
        } else {
            if (_userBalances[user] < stakeAmount) {
                revert GoErrors.InsufficientBalance();
            }
            _userBalances[user] -= stakeAmount;
            _totalUserBalance -= stakeAmount;
            _platformRevenue += stakeAmount;
        }
        if (USDC.balanceOf(address(this)) < _platformRevenue + _totalUserBalance + _totalLockedBalance) {
            revert GoErrors.InvariantViolation();
        }
        emit FundsReleased(user, stakeAmount, payoutAmount, accaId, won);
    }

    function requestPlatformWithdraw(uint256 amount, address to) external onlyOwner {
        if (amount == 0) {
            revert GoErrors.ZeroAmount();
        }
        if (amount > _platformRevenue) {
            revert GoErrors.InsufficientBalance();
        }
        if (to == address(0)) {
            revert GoErrors.InvalidAddress();
        }
        _pendingPlatformWithdrawAmount = amount;
        _pendingPlatformWithdrawTo = to;
        _lastPlatformWithdrawRequest = block.timestamp;
        emit PlatformWithdrawRequested(to, amount, block.timestamp + GoConstants.PLATFORM_WITHDRAW_TIMELOCK);
    }

    function executePlatformWithdraw() external nonReentrant onlyOwner {
        if (block.timestamp < _lastPlatformWithdrawRequest + GoConstants.PLATFORM_WITHDRAW_TIMELOCK) {
            revert GoErrors.TimelockNotElapsed();
        }
        uint256 amount = _pendingPlatformWithdrawAmount;
        address to = _pendingPlatformWithdrawTo;
        if (amount == 0 || to == address(0)) {
            revert GoErrors.InvalidAddress();
        }
        _pendingPlatformWithdrawAmount = 0;
        _pendingPlatformWithdrawTo = address(0);
        _platformRevenue -= amount;
        USDC.safeTransfer(to, amount);
        emit PlatformWithdrawn(to, amount);
    }

    function setAuthorisedCaller(address caller, bool status) external onlyOwner {
        if (caller == address(0)) {
            revert GoErrors.InvalidAddress();
        }
        if (status && !_authorisedCallers[caller]) {
            if (_callerCount >= GoConstants.MAX_AUTHORISED_CALLERS) {
                revert GoErrors.MaxCallersExceeded();
            }
            _callerCount++;
        } else if (!status && _authorisedCallers[caller]) {
            if (_callerCount <= 1) {
                revert GoErrors.MinCallersRequired(_callerCount);
            }
            _callerCount--;
        }
        _authorisedCallers[caller] = status;
        emit CallerUpdated(caller, status);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function userBalance(address user) external view returns (uint256 total, uint256 locked, uint256 available) {
        total = _userBalances[user];
        locked = _lockedBalances[user];
        unchecked {
            available = total >= locked ? total - locked : 0;
        }
    }

    function availableBalance(address user) external view returns (uint256) {
        return _availableBalance(user);
    }

    function platformRevenue() external view returns (uint256) {
        return _platformRevenue;
    }

    function isAuthorisedCaller(address caller) external view returns (bool) {
        return _authorisedCallers[caller];
    }

    function pendingPlatformWithdraw() external view returns (uint256 amount, address to, uint256 executeAt) {
        return (_pendingPlatformWithdrawAmount, _pendingPlatformWithdrawTo, _lastPlatformWithdrawRequest + GoConstants.PLATFORM_WITHDRAW_TIMELOCK);
    }

    function invariantCheck() external view returns (bool) {
        uint256 vaultBalance = USDC.balanceOf(address(this));
        return vaultBalance >= _platformRevenue + _totalUserBalance + _totalLockedBalance;
    }

    function _availableBalance(address user) private view returns (uint256) {
        uint256 total = _userBalances[user];
        uint256 locked = _lockedBalances[user];
        unchecked {
            return total >= locked ? total - locked : 0;
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        if (newImplementation == address(0)) {
            revert GoErrors.InvalidAddress();
        }
    }

    uint256[40] private __gap;
}
