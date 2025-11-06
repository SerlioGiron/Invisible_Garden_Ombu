import { useEffect, useRef } from "react";
import { Identity } from "@semaphore-protocol/identity";
import { usePrivy, useWallets } from "@privy-io/react-auth";

/**
 * Hook that automatically creates a Semaphore identity when user connects wallet
 * @param {Function} onIdentityCreated - Callback function called when identity is created
 */
export function useCreateIdentity(onIdentityCreated) {
    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();
    const identityCreatedRef = useRef(false);

    useEffect(() => {
        const createIdentity = async () => {
            // Skip if already created, not ready, not authenticated, or no wallets
            if (identityCreatedRef.current || !ready || !authenticated || !wallets || wallets.length === 0) {
                return;
            }

            try {
                console.log("✅ TEST: User authenticated, starting automatic identity creation");
                identityCreatedRef.current = true; // Prevent multiple calls

                const wallet = wallets[0];
                if (!wallet) {
                    console.log("❌ TEST: No wallet found");
                    identityCreatedRef.current = false;
                    return;
                }

                // Use wallet signature as deterministic secret for identity creation
                // This ensures the same wallet always generates the same identity
                const message = "By signing this message, you are creating a Semaphore identity for OMBU";

                console.log("🔵 TEST: Requesting signature from wallet");
                const provider = await wallet.getEthereumProvider();
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                const signature = await provider.request({
                    method: 'personal_sign',
                    params: [message, accounts[0]]
                });

                console.log("✅ TEST: Signature received:", signature.substring(0, 20) + "...");

                // Create deterministic identity from signature (secret)
                // According to Semaphore docs: new Identity("secret-value") creates deterministic identity
                const newIdentity = new Identity(signature);

                console.log("✅ TEST: Identity created successfully!", {
                    publicKey: newIdentity.publicKey,
                    commitment: newIdentity.commitment.toString(),
                    privateKey: newIdentity.privateKey ? "present" : "missing"
                });

                if (onIdentityCreated) {
                    onIdentityCreated(newIdentity);
                }
            } catch (error) {
                console.error("❌ TEST: Error creating identity:", error);
                console.error("❌ TEST: Error details:", {
                    message: error.message,
                    stack: error.stack
                });
                identityCreatedRef.current = false; // Allow retry on error
            }
        };

        createIdentity();
    }, [ready, authenticated, wallets, onIdentityCreated]);

    // Reset when user disconnects
    useEffect(() => {
        if (!authenticated) {
            identityCreatedRef.current = false;
        }
    }, [authenticated]);
}

// Keep the component export for backwards compatibility if needed elsewhere
export default function CreateIdentity({ onIdentityCreated }) {
    useCreateIdentity(onIdentityCreated);
    return null; // No UI needed, it's automatic
}
