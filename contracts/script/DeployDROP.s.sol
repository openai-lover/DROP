// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {DROPRewardEscrow} from "../src/DROPRewardEscrow.sol";

interface DeploymentVm {
    function envUint(string calldata name) external returns (uint256);
    function envAddress(string calldata name) external returns (address);
    function startBroadcast(address signer) external;
    function stopBroadcast() external;
}

/// @dev Dry-run unless the operator explicitly passes --broadcast. Use --account with a keystore.
contract DeployDROP {
    DeploymentVm private constant vm = DeploymentVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (DROPRewardEscrow deployed) {
        uint256 expectedChainId = vm.envUint("DROP_DEPLOY_CHAIN_ID");
        address token = vm.envAddress("DROP_DEPLOY_USDC_ADDRESS");
        address deployer = vm.envAddress("DROP_DEPLOYER_ADDRESS");
        require(expectedChainId == 10143, "This submission script only deploys to approved Monad Testnet");
        require(block.chainid == expectedChainId, "Connected chain differs from explicit deployment chain");
        require(token == 0x534b2f3A21130d7a60830c2Df862319e593943A3, "Use Circle's Monad Testnet USDC");
        require(deployer != address(0), "Explicit deployer required");
        vm.startBroadcast(deployer);
        deployed = new DROPRewardEscrow(token, expectedChainId);
        vm.stopBroadcast();
    }
}
