import { useEffect, useRef, useState } from "react";
import { Identity } from "@semaphore-protocol/identity";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { DEFAULT_GROUP_ID } from "../services/contract";
import { verifyCommitmentOnChain } from "../services/relayerApi";

/**
 * Hook that automatically creates (or reuses) a Semaphore identity when the user is authenticated.
 * Returns the commitment along with loading states so callers can react accordingly.
 */
export function useCreateIdentity() {
    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();
    const identityCreatedRef = useRef(false);
    const walletAddressRef = useRef(null);

    const [commitment, setCommitment] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);
    const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

    // Load commitment from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") {
            setHasCheckedStorage(true);
            return;
        }
        const storedSignature = localStorage.getItem("ombuSemaphoreSignature");
        const storedWalletAddress = localStorage.getItem("ombuSemaphoreWalletAddress");

        // Always derive commitment from signature (single source of truth)
        if (storedSignature) {
            try {
                const identity = new Identity(storedSignature);
                const commitmentValue = identity.commitment.toString();
                setCommitment(commitmentValue);
                walletAddressRef.current = storedWalletAddress;
            } catch (error) {
                console.warn("⚠️ Failed to reconstruct identity, will recreate");
                localStorage.removeItem("ombuSemaphoreSignature");
                localStorage.removeItem("ombuSemaphoreWalletAddress");
                setCommitment(null);
            }
        }
        setHasCheckedStorage(true);
    }, []);

    useEffect(() => {
        // Reset state when user logs out
        if (!ready || !authenticated) {
            identityCreatedRef.current = false;
            setIsCreating(false);
            setError(null);
            setCommitment(null);
            walletAddressRef.current = null;
            // Clear localStorage on logout
            if (typeof window !== "undefined") {
                localStorage.removeItem("ombuSemaphoreSignature");
                localStorage.removeItem("ombuSemaphoreWalletAddress");
            }
            return;
        }

        if (!hasCheckedStorage) {
            return;
        }

        // Wait for wallets to be available
        if (!wallets || wallets.length === 0) {
            return;
        }

        const currentWallet = wallets[0];
        const currentWalletAddress = currentWallet?.address?.toLowerCase();

        // Check if wallet has changed - if so, clear old identity
        if (walletAddressRef.current && walletAddressRef.current !== currentWalletAddress) {
            console.warn("⚠️ Wallet changed. Clearing old identity and creating new one...");
            if (typeof window !== "undefined") {
                localStorage.removeItem("ombuSemaphoreSignature");
                localStorage.removeItem("ombuSemaphoreWalletAddress");
            }
            setCommitment(null);
            identityCreatedRef.current = false;
        }

        // If we have a commitment and it's valid, verify it matches current wallet
        if (commitment || identityCreatedRef.current) {
            const storedSignature = localStorage.getItem("ombuSemaphoreSignature");
            const storedWalletAddress = localStorage.getItem("ombuSemaphoreWalletAddress");

            // If signature is missing, recreate
            if (!storedSignature) {
                console.warn("⚠️ Signature missing. Recreating identity...");
                if (typeof window !== "undefined") {
                    localStorage.removeItem("ombuSemaphoreWalletAddress");
                }
                setCommitment(null);
                identityCreatedRef.current = false;
                return;
            }

            // If wallet address doesn't match, recreate
            if (storedWalletAddress && storedWalletAddress !== currentWalletAddress) {
                console.warn("⚠️ Wallet address mismatch. Recreating identity...");
                if (typeof window !== "undefined") {
                    localStorage.removeItem("ombuSemaphoreSignature");
                    localStorage.removeItem("ombuSemaphoreWalletAddress");
                }
                setCommitment(null);
                identityCreatedRef.current = false;
                return;
            }

            return;
        }

        let cancelled = false;

        const createIdentity = async () => {
            try {
                setIsCreating(true);
                identityCreatedRef.current = true;
                setError(null);

                const wallet = wallets[0];
                if (!wallet) {
                    throw new Error("Wallet not available");
                }

                const walletAddress = wallet.address?.toLowerCase();
                if (!walletAddress) {
                    throw new Error("Wallet address not available");
                }

                const message = "By signing this message, you are creating a Semaphore identity for OMBU";

                const provider = await wallet.getEthereumProvider();
                const accounts = await provider.request({ method: "eth_requestAccounts" });
                
                if (!accounts || accounts.length === 0) {
                    throw new Error("No accounts available");
                }
                
                const signature = await provider.request({
                    method: "personal_sign",
                    params: [message, accounts[0]],
                });

                const newIdentity = new Identity(signature);
                const commitmentValue = newIdentity.commitment.toString();

                // Via relayer (gasless - relayer pays for gas)
                const relayerUrl = import.meta.env.VITE_RELAYER_URL || 'http://localhost:3001';

                try {
                    const requestBody = {
                        identityCommitment: commitmentValue,
                        groupId: DEFAULT_GROUP_ID
                    };

                    const response = await fetch(`${relayerUrl}/api/join`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || errorData.error || 'Failed to join group');
                    }

                    const result = await response.json();
                    console.log("✅ Joined group:", result.transactionHash);

                    // Verify that the commitment was stored in the database
                    try {
                        const verifyResponse = await fetch(`${relayerUrl}/api/check-member?identityCommitment=${commitmentValue}&groupId=${DEFAULT_GROUP_ID}`);

                        if (verifyResponse.ok) {
                            const verifyResult = await verifyResponse.json();
                            if (!verifyResult.isMember) {
                                console.warn("⚠️ Commitment not found in database yet");
                            }
                        }
                    } catch (verifyError) {
                        // Don't throw - this is just a verification step
                    }
                } catch (relayerError) {
                    console.error("❌ Error joining group:", relayerError.message);
                    throw relayerError;
                }

                if (typeof window !== "undefined") {
                    try {
                        // Only store signature and wallet address
                        // Commitment will always be derived from signature
                        localStorage.setItem("ombuSemaphoreSignature", signature);
                        localStorage.setItem("ombuSemaphoreWalletAddress", walletAddress);
                        walletAddressRef.current = walletAddress;
                        window.dispatchEvent(
                            new CustomEvent("ombuCommitmentCreated", {
                                detail: commitmentValue,
                            })
                        );
                    } catch (storageError) {
                        console.warn("⚠️ Unable to persist identity in localStorage", storageError);
                    }
                }

                if (!cancelled) {
                    setCommitment(commitmentValue);
                }
            } catch (err) {
                console.error("❌ Error creating identity:", err);
                if (!cancelled) {
                    setError(err);
                    identityCreatedRef.current = false;
                }
            } finally {
                if (!cancelled) {
                    setIsCreating(false);
                }
            }
        };

        createIdentity();

        return () => {
            cancelled = true;
        };
    }, [ready, authenticated, wallets, commitment, hasCheckedStorage]);

    return { commitment, isCreating, error };
}

export default function CreateIdentity() {
    useCreateIdentity();
    return null;
}
