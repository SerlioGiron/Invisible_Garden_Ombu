import { createConfig, http } from "wagmi";
import { defineChain } from "viem";

const chainId = Number(import.meta.env.VITE_PUBLIC_CHAIN_ID || 11155111);
const rpcUrl = import.meta.env.VITE_PUBLIC_RPC_URL || "https://rpc.sepolia.org";

export const customChain = defineChain({
    id: chainId,
    name: chainId === 11155111 ? "Sepolia" : `Chain ${chainId}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
});

export const config = createConfig({
    chains: [customChain],
    transports: { [customChain.id]: http(rpcUrl) },
});
