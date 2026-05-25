@echo off
echo === GO Market Contracts — Setup Script ===
echo.

echo Step 1: Installing Foundry (if not already installed)
where forge >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Foundry not found. Run the following in PowerShell:
    echo   curl -L https://foundry.paradigm.xyz ^| bash
    echo   foundryup
    echo.
    echo Or visit: https://book.getfoundry.sh/getting-started/installation
    pause
)

echo Step 2: Installing OpenZeppelin dependencies
forge install OpenZeppelin/openzeppelin-contracts@v5.2.0 --no-commit
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@v5.2.0 --no-commit
forge install foundry-rs/forge-std --no-commit

echo Step 3: Compiling contracts
forge build

echo Step 4: Running tests
forge test -vvv

echo.
echo === Setup Complete ==="
