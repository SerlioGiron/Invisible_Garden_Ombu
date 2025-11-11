// filepath: script/DeployOmbu.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/Ombu.sol";

contract DeployOmbuScript is Script {
    function run() external {
        address semaphore = 0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D; // dirección de Semaphore en arbitrum sepolia
        //address admin = 0x6E89B5168A0a3373D87559C5d1D279b3c89b6104; // Relayer Arbitrum Sepolia

        vm.startBroadcast();
        new Ombu(semaphore);
        vm.stopBroadcast();
    }
}
