import { useEffect, useRef, useState } from "react";
import { Identity } from "@semaphore-protocol/identity";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { DEFAULT_GROUP_ID } from "../services/contract";

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
        const storedCommitment = localStorage.getItem("ombuSemaphoreCommitment");
        const storedSignature = localStorage.getItem("ombuSemaphoreSignature");
        const storedWalletAddress = localStorage.getItem("ombuSemaphoreWalletAddress");
        
        // If commitment exists but signature is missing, we need to recreate the identity
        if (storedCommitment && !storedSignature) {
            console.warn("⚠️ Commitment found but signature missing. Will recreate identity.");
            localStorage.removeItem("ombuSemaphoreCommitment");
            localStorage.removeItem("ombuSemaphoreWalletAddress");
            setCommitment(null);
        } else if (storedCommitment && storedSignature) {
            setCommitment(storedCommitment);
            walletAddressRef.current = storedWalletAddress;
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
                localStorage.removeItem("ombuSemaphoreCommitment");
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
                localStorage.removeItem("ombuSemaphoreCommitment");
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
                console.warn("⚠️ Commitment exists but signature missing. Recreating identity...");
                if (typeof window !== "undefined") {
                    localStorage.removeItem("ombuSemaphoreCommitment");
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
                    localStorage.removeItem("ombuSemaphoreCommitment");
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

                console.log("✅ TEST: Identity created successfully!", {
                    publicKey: newIdentity.publicKey,
                    commitment: commitmentValue,
                    privateKey: newIdentity.privateKey ? "present" : "missing",
                });


                // Option 2: Via relayer (gasless - relayer pays for gas)
                console.log("🔵 TEST: Adding member to Semaphore group via relayer...");
                console.log("   Commitment:", commitmentValue);
                console.log("   Group ID:", DEFAULT_GROUP_ID);
                console.log("   Relayer URL: http://localhost:3001/api/join");
                
                try {
                    const requestBody = {
                        identityCommitment: commitmentValue,
                        groupId: DEFAULT_GROUP_ID
                    };
                    console.log("   Request body:", JSON.stringify(requestBody, null, 2));
                    
                    const response = await fetch('http://localhost:3001/api/join', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    });

                    console.log("   Response status:", response.status);
                    console.log("   Response ok:", response.ok);

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error("❌ TEST: Relayer error response:");
                        console.error("   Error:", errorData.error);
                        console.error("   Message:", errorData.message);
                        console.error("   Details:", errorData.details);
                        console.error("   Code:", errorData.code);
                        console.error("   Error data:", errorData.errorData);
                        throw new Error(errorData.message || errorData.error || 'Failed to join group');
                    }

                    const result = await response.json();
                    console.log("✅ TEST: Member added to Semaphore group successfully!");
                    console.log("   Result:", JSON.stringify(result, null, 2));
                } catch (relayerError) {
                    console.error("❌ TEST: Error adding member via relayer:");
                    console.error("   Error type:", relayerError.constructor.name);
                    console.error("   Error message:", relayerError.message);
                    console.error("   Error stack:", relayerError.stack);
                    throw relayerError;
                }

                if (typeof window !== "undefined") {
                    try {
                        localStorage.setItem("ombuSemaphoreCommitment", commitmentValue);
                        // Store the signature so we can reconstruct the identity for proof generation
                        localStorage.setItem("ombuSemaphoreSignature", signature);
                        // Store wallet address to detect wallet changes
                        localStorage.setItem("ombuSemaphoreWalletAddress", walletAddress);
                        walletAddressRef.current = walletAddress;
                        console.log("✅ TEST: Commitment, signature, and wallet address stored in localStorage");
                        window.dispatchEvent(
                            new CustomEvent("ombuCommitmentCreated", {
                                detail: commitmentValue,
                            })
                        );
                    } catch (storageError) {
                        console.warn("⚠️ TEST: Unable to persist commitment in localStorage", storageError);
                    }
                }

                if (!cancelled) {
                    setCommitment(commitmentValue);
                }
            } catch (err) {
                console.error("❌ TEST: Error creating identity:", err);
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
