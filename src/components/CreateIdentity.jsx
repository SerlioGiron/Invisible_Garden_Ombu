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
                console.log("✅ Loaded identity from signature. Commitment:", commitmentValue);
            } catch (error) {
                console.warn("⚠️ Failed to reconstruct identity from signature. Will recreate.", error);
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

            // Log current identity details on login
            try {
                const identity = new Identity(storedSignature);
                console.log("🔑 User logged in with existing identity:");
                console.log("   Wallet Address:", storedWalletAddress);
                console.log("   Commitment Hash:", commitment);
                console.log("   Public Key:", identity.publicKey);
                console.log("   Group ID:", DEFAULT_GROUP_ID);
            } catch (identityError) {
                console.error("❌ Error reconstructing identity for logging:", identityError);
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

                console.log("✅ Identity created successfully!", {
                    commitment: commitmentValue,
                    walletAddress,
                });


                // Option 2: Via relayer (gasless - relayer pays for gas)
                const relayerUrl = import.meta.env.VITE_RELAYER_URL || 'http://localhost:3001';
                console.log("🔵 Adding member to Semaphore group via relayer...");
                console.log("   Commitment:", commitmentValue);
                console.log("   Group ID:", DEFAULT_GROUP_ID);
                console.log("   Relayer URL:", `${relayerUrl}/api/join`);

                try {
                    const requestBody = {
                        identityCommitment: commitmentValue,
                        groupId: DEFAULT_GROUP_ID
                    };
                    console.log("   Request body:", JSON.stringify(requestBody, null, 2));

                    const response = await fetch(`${relayerUrl}/api/join`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error("❌ Relayer error:", errorData.message || errorData.error);
                        throw new Error(errorData.message || errorData.error || 'Failed to join group');
                    }

                    const result = await response.json();
                    console.log("✅ Successfully joined Semaphore group!");
                    console.log("   Transaction:", result.transactionHash);

                    // Verify that the commitment was stored in the database
                    console.log("🔍 Verifying commitment was stored in database...");
                    try {
                        const verifyResponse = await fetch(`${relayerUrl}/api/check-member?identityCommitment=${commitmentValue}&groupId=${DEFAULT_GROUP_ID}`);

                        if (verifyResponse.ok) {
                            const verifyResult = await verifyResponse.json();
                            if (verifyResult.isMember) {
                                console.log("✅ Commitment verified in database!");
                                console.log("   Source:", verifyResult.source);
                            } else {
                                console.warn("⚠️ Commitment not found in database yet. It may take a moment to sync.");
                            }
                        } else {
                            console.warn("⚠️ Could not verify commitment in database:", await verifyResponse.text());
                        }
                    } catch (verifyError) {
                        console.warn("⚠️ Error verifying commitment (non-critical):", verifyError.message);
                        // Don't throw - this is just a verification step
                    }
                } catch (relayerError) {
                    console.error("❌ Error joining group via relayer:", relayerError.message);
                    throw relayerError;
                }

                if (typeof window !== "undefined") {
                    try {
                        // Only store signature and wallet address
                        // Commitment will always be derived from signature
                        localStorage.setItem("ombuSemaphoreSignature", signature);
                        localStorage.setItem("ombuSemaphoreWalletAddress", walletAddress);
                        walletAddressRef.current = walletAddress;
                        console.log("✅ Identity signature saved to localStorage");
                        console.log("   Commitment (derived):", commitmentValue);
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
