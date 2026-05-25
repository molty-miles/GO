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
    struct DeployedContracts {
        GoVault vault;
        GoManager manager;
        GoAdaptorRegistry adaptorRegistry;
        GoLimitlessAdaptor limitlessAdaptor;
        GoPolymarketAdaptor polymarketAdaptor;
        GoDFlowRelayAdaptor dflowRelayAdaptor;
    }

    function run() external returns (DeployedContracts memory) {
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

        GoLimitlessAdaptor limitlessAdaptor = new GoLimitlessAdaptor();
        limitlessAdaptor.initialize(USDC, limitlessExchange, limitlessOracle);
        console2.log("GoLimitlessAdaptor:", address(limitlessAdaptor));

        GoPolymarketAdaptor polymarketAdaptor = new GoPolymarketAdaptor();
        polymarketAdaptor.initialize(USDC, ctfExchange, conditionalTokens, umaOracle);
        console2.log("GoPolymarketAdaptor:", address(polymarketAdaptor));

        GoDFlowRelayAdaptor dflowRelayAdaptor = new GoDFlowRelayAdaptor();
        dflowRelayAdaptor.initialize();
        console2.log("GoDFlowRelayAdaptor:", address(dflowRelayAdaptor));

        registry.registerAdaptor(address(limitlessAdaptor), "limitless-v1", "1.0.0");
        registry.registerAdaptor(address(polymarketAdaptor), "polymarket-v2", "1.0.0");
        registry.registerAdaptor(address(dflowRelayAdaptor), "dflow-kalshi-v1", "1.0.0");

        vm.stopBroadcast();

        console2.log("=== GO Market Deployment Complete ===");
        console2.log("Vault:                 ", address(vault));
        console2.log("Manager:               ", address(manager));
        console2.log("Registry:              ", address(registry));
        console2.log("LimitlessAdaptor:      ", address(limitlessAdaptor));
        console2.log("PolymarketAdaptor:     ", address(polymarketAdaptor));
        console2.log("DFlowRelayAdaptor:     ", address(dflowRelayAdaptor));
        console2.log("Settlement Coordinator:", settlementCoordinator);

        return DeployedContracts({
            vault: vault,
            manager: manager,
            adaptorRegistry: registry,
            limitlessAdaptor: limitlessAdaptor,
            polymarketAdaptor: polymarketAdaptor,
            dflowRelayAdaptor: dflowRelayAdaptor
        });
    }

    function _getUSDC() private pure returns (address) {
        return vm.envOr("USDC_ADDRESS", address(0));
    }

    function _getLimitlessExchange() private pure returns (address) {
        return vm.envOr("LIMITLESS_EXCHANGE", address(0));
    }

    function _getLimitlessOracle() private pure returns (address) {
        return vm.envOr("LIMITLESS_ORACLE", address(0));
    }

    function _getCtfExchange() private pure returns (address) {
        return vm.envOr("CTF_EXCHANGE", address(0));
    }

    function _getConditionalTokens() private pure returns (address) {
        return vm.envOr("CONDITIONAL_TOKENS", address(0));
    }

    function _getUmaOracle() private pure returns (address) {
        return vm.envOr("UMA_ORACLE", address(0));
    }
}
