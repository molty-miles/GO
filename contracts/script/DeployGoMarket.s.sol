// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { GoVault } from "../src/GoVault.sol";
import { GoManager } from "../src/GoManager.sol";
import { GoAdaptorRegistry } from "../src/GoAdaptorRegistry.sol";
import { GoLimitlessAdaptor } from "../src/adaptors/GoLimitlessAdaptor.sol";
import { GoPolymarketAdaptor } from "../src/adaptors/GoPolymarketAdaptor.sol";
import { GoDFlowRelayAdaptor } from "../src/adaptors/GoDFlowRelayAdaptor.sol";

contract DeployGoMarket is Script {
    function run() external {
        address deployer = msg.sender;
        address settlementCoordinator = vm.envAddress("SETTLEMENT_COORDINATOR");

        console2.log("Deploying GO Market contracts");
        console2.log("Deployer:", deployer);
        console2.log("Settlement Coordinator:", settlementCoordinator);

        vm.startBroadcast(deployer);

        address USDC = _getUSDC();
        address limitlessExchange = _getLimitlessExchange();
        address limitlessOracle = _getLimitlessOracle();
        address ctfExchange = _getCtfExchange();
        address conditionalTokens = _getConditionalTokens();
        address umaOracle = _getUmaOracle();

        GoAdaptorRegistry registry = new GoAdaptorRegistry();
        registry.initialize();
        console2.log("GoAdaptorRegistry:", address(registry));

        GoVault vaultImpl = new GoVault();
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImpl), abi.encodeWithSelector(GoVault.initialize.selector, USDC));
        GoVault vault = GoVault(address(vaultProxy));
        console2.log("GoVault:", address(vault));

        GoManager managerImpl = new GoManager();
        ERC1967Proxy managerProxy = new ERC1967Proxy(
            address(managerImpl),
            abi.encodeWithSelector(GoManager.initialize.selector, address(vault), address(registry), settlementCoordinator)
        );
        GoManager manager = GoManager(address(managerProxy));
        console2.log("GoManager:", address(manager));

        vault.setAuthorisedCaller(address(manager), true);
        console2.log("GoManager authorised on vault");

        GoDFlowRelayAdaptor dflowRelayAdaptor = new GoDFlowRelayAdaptor();
        dflowRelayAdaptor.initialize();
        console2.log("GoDFlowRelayAdaptor:", address(dflowRelayAdaptor));
        registry.registerAdaptor(address(dflowRelayAdaptor), "dflow-kalshi-v1", "1.0.0");

        if (limitlessExchange != address(0) && limitlessOracle != address(0)) {
            GoLimitlessAdaptor limitlessAdaptor = new GoLimitlessAdaptor();
            limitlessAdaptor.initialize(USDC, limitlessExchange, limitlessOracle);
            console2.log("GoLimitlessAdaptor:", address(limitlessAdaptor));
            registry.registerAdaptor(address(limitlessAdaptor), "limitless-v1", "1.0.0");
        } else {
            console2.log("GoLimitlessAdaptor: SKIPPED");
        }

        if (ctfExchange != address(0) && conditionalTokens != address(0)) {
            GoPolymarketAdaptor polymarketAdaptor = new GoPolymarketAdaptor();
            address umaRequester = vm.envOr("UMA_REQUESTER", address(0));
            polymarketAdaptor.initialize(USDC, ctfExchange, conditionalTokens, umaOracle, umaRequester);
            console2.log("GoPolymarketAdaptor:", address(polymarketAdaptor));
            registry.registerAdaptor(address(polymarketAdaptor), "polymarket-v2", "1.0.0");
        } else {
            console2.log("GoPolymarketAdaptor: SKIPPED");
        }

        vm.stopBroadcast();

        console2.log("=== GO Market Deployment Complete ===");
        console2.log("Vault:                 ", address(vault));
        console2.log("Manager:               ", address(manager));
        console2.log("Registry:              ", address(registry));
        console2.log("DFlowRelayAdaptor:     ", address(dflowRelayAdaptor));
        console2.log("Settlement Coordinator:", settlementCoordinator);
    }

    function _getUSDC() private view returns (address) {
        return vm.envOr("USDC_ADDRESS", address(0));
    }

    function _getLimitlessExchange() private view returns (address) {
        return vm.envOr("LIMITLESS_EXCHANGE", address(0));
    }

    function _getLimitlessOracle() private view returns (address) {
        return vm.envOr("LIMITLESS_ORACLE", address(0));
    }

    function _getCtfExchange() private view returns (address) {
        return vm.envOr("CTF_EXCHANGE", address(0));
    }

    function _getConditionalTokens() private view returns (address) {
        return vm.envOr("CONDITIONAL_TOKENS", address(0));
    }

    function _getUmaOracle() private view returns (address) {
        return vm.envOr("UMA_ORACLE", address(0));
    }
}
