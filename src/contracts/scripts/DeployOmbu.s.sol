// filepath: script/DeployOmbu.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {Ombu} from "../Ombu.sol";

contract DeployOmbuScript is Script {
    function run() external {
        address semaphore = 0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D; // ArbitrumSepolia Semaphore address
        address admin = msg.sender; // Admin address

        vm.startBroadcast();
        new Ombu(semaphore, admin);
        vm.stopBroadcast();
    }
}
