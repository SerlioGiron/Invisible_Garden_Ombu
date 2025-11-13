export const OMBU_CONTRACT_ADDRESS = "0xba2D5EeBdaD4A3d5283F936947B6cF60F8DCD3Fb";

/**
 * Semaphore Contract Address (Arbitrum Sepolia)
 * The Semaphore protocol contract for zero-knowledge group management
 * Address: https://docs.semaphore.pse.dev/deployed-contracts
 */
export const SEMAPHORE_CONTRACT_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";
export const DEFAULT_GROUP_ID = 7;
export const INITIAL_GROUP_NAME = "Invisible Garden";
export const CHAIN_ID = 421614;
export const NETWORK_NAME = "Arbitrum Sepolia";
export const RPC_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_RPC_URL) || process.env.VITE_PUBLIC_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";

export const CONTRACT_CONFIG = {
    address: OMBU_CONTRACT_ADDRESS,
    chainId: CHAIN_ID,
    networkName: NETWORK_NAME,
};

export default {
    OMBU_CONTRACT_ADDRESS,
    SEMAPHORE_CONTRACT_ADDRESS,
    DEFAULT_GROUP_ID,
    INITIAL_GROUP_NAME,
    CHAIN_ID,
    NETWORK_NAME,
    RPC_URL,
    CONTRACT_CONFIG,
};
