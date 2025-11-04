import React from "react";
import { Button } from "@mantine/core";
import { Identity } from "@semaphore-protocol/identity";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { keccak256, stringToBytes, hexToBigInt } from "viem";

function CreateIdentity({ onIdentityCreated, groupId }) {
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

            // Derive a deterministic secret from signature + group using keccak256
            const groupPart = groupId ? String(groupId) : "";
            const input = [signature, groupPart].filter(Boolean).join(":");

            console.log("Creating identity with input parts:", { signature: signature.slice(0, 10) + "...", groupPart });

            const seedHex = keccak256(stringToBytes(input));
            console.log("Seed hex:", seedHex);

            // Convert hex to BigInt string for Semaphore Identity
            const identitySecret = hexToBigInt(seedHex).toString();
            console.log("Identity secret (BigInt as string):", identitySecret);

            const identity = new Identity(identitySecret);

            console.log("Identity created");
            console.log("Commitment:", identity.commitment.toString());

            localStorage.setItem("semaphore_commitment", identity.commitment.toString());

            alert("Identity created successfully!");

            if (onIdentityCreated) {
                onIdentityCreated(identity);
            }
        } catch (error) {
            console.error("Error creating identity:", error);

            // Provide more specific error messages
            let errorMessage = "Failed to create identity. ";
            if (error.message?.includes("User rejected")) {
                errorMessage += "Signature was rejected.";
            } else if (error.message?.includes("provider")) {
                errorMessage += "Wallet provider error.";
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += "Please try again.";
            }

            alert(errorMessage);
        }
    };

    return (
        <Button onClick={handleCreateIdentity}>
            Create Identity
        </Button>
    );
}

export default CreateIdentity;
