import express from "express";
import {Contract, JsonRpcProvider, Wallet} from "ethers";
import {readFileSync} from "fs";
import {fileURLToPath} from "url";
import {dirname, join} from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Cargar ABI del contrato
const abiPath = join(__dirname, "../../out/Ombu.sol/Ombu.json");
let OmbuArtifact;
try {
    OmbuArtifact = JSON.parse(readFileSync(abiPath, "utf8"));
} catch (error) {
    console.error("❌ Error loading contract ABI:", error.message);
    console.error("   Make sure to compile contracts with: forge build");
}

router.post("/", async (req, res) => {
    try {
        const {identityCommitment, groupId} = req.body;

        // Validación de entrada
        if (!identityCommitment) {
            return res.status(400).json({
                error: "Missing required parameter",
                details: "identityCommitment is required",
            });
        }

        // groupId es opcional, por defecto 1
        const selectedGroupId = groupId || 1;

        // Validar que el ABI esté cargado
        if (!OmbuArtifact || !OmbuArtifact.abi) {
            return res.status(500).json({
                error: "Contract ABI not loaded",
                details: 'Run "forge build" to compile contracts',
            });
        }

        // Configurar provider y signer
        const provider = new JsonRpcProvider(process.env.RPC_URL);
        const signer = new Wallet(process.env.PRIVATE_KEY, provider);
        const contract = new Contract(process.env.CONTRACT_ADDRESS, OmbuArtifact.abi, signer);

        console.log("📝 Joining group...");
        console.log("   Group ID:", selectedGroupId);
        console.log("   Identity Commitment:", identityCommitment);
        console.log("   Contract:", process.env.CONTRACT_ADDRESS);

        // Verificar balance del signer
        const balance = await provider.getBalance(signer.address);
        console.log("   Relayer balance:", balance.toString());

        if (balance === 0n) {
            return res.status(500).json({
                error: "Insufficient funds",
                details: "Relayer wallet has no funds to pay for gas",
            });
        }

        // Ejecutar transacción
        const transaction = await contract.addMember(selectedGroupId, identityCommitment);
        console.log("   Transaction sent:", transaction.hash);

        const receipt = await transaction.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

        return res.status(200).json({
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
        });
    } catch (error) {
        console.error("❌ Error in join route:", error);

        // Manejar errores específicos de ethers
        let errorMessage = error.message;
        if (error.code === "INSUFFICIENT_FUNDS") {
            errorMessage = "Relayer wallet has insufficient funds for gas";
        } else if (error.code === "CALL_EXCEPTION") {
            errorMessage = "Smart contract call failed. User may already be in group.";
        }

        return res.status(500).json({
            error: "Transaction failed",
            message: errorMessage,
            code: error.code,
        });
    }
});

export default router;
