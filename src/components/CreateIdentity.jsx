import React from "react";
import { Button } from "@mantine/core";
import { Identity } from "@semaphore-protocol/identity";
import { usePrivy, useWallets } from "@privy-io/react-auth";

function CreateIdentity({ onIdentityCreated }) {
    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();

    const handleCreateIdentity = async () => {
        try {
            if (!ready || !authenticated) {
                alert("Please log in first");
                return;
            }

            const wallet = wallets[0];
            if (!wallet) {
                alert("Please log in first");
                return;
            }

            const message = "By signing this message, you are creating a Semaphore identity";

            const provider = await wallet.getEthereumProvider();

            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const signature = await provider.request({
                method: 'personal_sign',
                params: [message, accounts[0]]
            });

            const identity = new Identity(signature); // This will hash the signature to create the commitment

            console.log("Identity created:", {
                publicKey: identity.publicKey
            })
            console.log("Commitment:", identity.commitment.toString());

            localStorage.setItem("semaphore_commitment", identity.commitment.toString());

            alert("Identity created successfully!");

            if (onIdentityCreated) {
                onIdentityCreated(identity);
            }
        } catch (error) {
            console.error("Error creating identity:", error);
            alert("Failed to create identity. Please try again.");
        }
    };

    return (
        <Button onClick={handleCreateIdentity}>
            Create Identity
        </Button>
    );
}

export default CreateIdentity;
