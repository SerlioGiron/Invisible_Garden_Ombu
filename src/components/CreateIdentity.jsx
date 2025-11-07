import { useEffect, useRef, useState } from "react";
import { Identity } from "@semaphore-protocol/identity";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_CONFIG, DEFAULT_GROUP_ID } from "../services/contract";

/**
 * Hook that automatically creates (or reuses) a Semaphore identity when the user is authenticated.
 * Returns the commitment along with loading states so callers can react accordingly.
 */
export function useCreateIdentity() {
    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();
    const identityCreatedRef = useRef(false);
    const { writeContract, data: hash } = useWriteContract();

    const [commitment, setCommitment] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    // Load commitment from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const storedCommitment = localStorage.getItem("ombuSemaphoreCommitment");
        if (storedCommitment) {
            setCommitment(storedCommitment);
        }
    }, []);

    useEffect(() => {
        if (!ready || !authenticated) {
            identityCreatedRef.current = false;
            setIsCreating(false);
            setError(null);
            return;
        }

        if (commitment || identityCreatedRef.current) {
            return;
        }

        if (!wallets || wallets.length === 0) {
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

                const message = "By signing this message, you are creating a Semaphore identity for OMBU";

                const provider = await wallet.getEthereumProvider();
                const accounts = await provider.request({ method: "eth_requestAccounts" });
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

                console.log("🔵 TEST: Adding member to Semaphore group...");
                await writeContract({
                    address: CONTRACT_CONFIG.address,
                    abi: CONTRACT_CONFIG.abi,
                    functionName: "addMember",
                    args: [DEFAULT_GROUP_ID, newIdentity.commitment],
                });

                if (typeof window !== "undefined") {
                    try {
                        localStorage.setItem("ombuSemaphoreCommitment", commitmentValue);
                        console.log("✅ TEST: Commitment stored in localStorage");
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
    }, [ready, authenticated, wallets, writeContract, commitment]);

    useEffect(() => {
        if (isConfirming) {
            console.log("⏳ TEST: Waiting for transaction confirmation...");
        }
        if (isConfirmed) {
            console.log("✅ TEST: Member added to Semaphore group successfully!");
        }
    }, [isConfirming, isConfirmed]);

    return { commitment, isCreating, isConfirming, isConfirmed, error };
}

export default function CreateIdentity() {
    useCreateIdentity();
    return null;
}
