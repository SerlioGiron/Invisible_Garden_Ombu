// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";

interface ISemaphore {
    function updateGroupAdmin(uint256 groupId, address newAdmin) external;
}

interface IOmbu {
    function acceptGroupAdmin(uint256 groupId) external;
}

contract TransferGroupAdminScript is Script {
    function run() external {
        address semaphore = 0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D; // Arbitrum Sepolia
        address ombuContract = 0x3F70431e4ccc1DD4e6d0f8394a4ecc2e67767358; // Your deployed Ombu
        uint256 groupId = 5;

        vm.startBroadcast();

        // Step 1: Current admin (msg.sender = deployer) transfers admin to Ombu contract
        ISemaphore(semaphore).updateGroupAdmin(groupId, ombuContract);

        // Step 2: Ombu contract accepts the admin role
        IOmbu(ombuContract).acceptGroupAdmin(groupId);

        vm.stopBroadcast();
    }
}
