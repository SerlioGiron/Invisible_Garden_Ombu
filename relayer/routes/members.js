import express from "express";
import {Contract, JsonRpcProvider} from "ethers";
import {getIdentityCommitmentsByGroup} from "../utils/mongodb.js";

const router = express.Router();

// Semaphore contract address on Arbitrum Sepolia
const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";

router.get("/:groupId", async (req, res) => {
    try {
        const {groupId} = req.params;
        const groupIdNum = parseInt(groupId);

        console.log(`🔵 Fetching members for group ${groupId} from database...`);

        // Use MongoDB as the single source of truth for members
        // Members are stored in chronological order when they join via /api/join
        let members = [];
        try {
            members = await getIdentityCommitmentsByGroup(groupIdNum);
            console.log(`✅ Retrieved ${members.length} members from database for group ${groupId}`);
        } catch (dbError) {
            console.error("❌ Error fetching members from database:", dbError.message);
            // If database fails, return empty array - don't fail the entire request
            // Group metadata (root, depth, size) will still be returned from blockchain
            members = [];
        }

        // Get group metadata from RPC (only metadata, not members - much faster)
        const provider = new JsonRpcProvider(process.env.RPC_URL);
        const semaphoreABI = [
            {
                inputs: [{name: "groupId", type: "uint256"}],
                name: "getMerkleTreeRoot",
                outputs: [{name: "", type: "uint256"}],
                stateMutability: "view",
                type: "function",
            },
            {
                inputs: [{name: "groupId", type: "uint256"}],
                name: "getMerkleTreeDepth",
                outputs: [{name: "", type: "uint256"}],
                stateMutability: "view",
                type: "function",
            },
            {
                inputs: [{name: "groupId", type: "uint256"}],
                name: "getMerkleTreeSize",
                outputs: [{name: "", type: "uint256"}],
                stateMutability: "view",
                type: "function",
            },
        ];

        const semaphoreContract = new Contract(SEMAPHORE_ADDRESS, semaphoreABI, provider);
        const root = await semaphoreContract.getMerkleTreeRoot(groupId);
        const depth = await semaphoreContract.getMerkleTreeDepth(groupId);
        const size = await semaphoreContract.getMerkleTreeSize(groupId);

        console.log(`✅ Group data fetched successfully`);
        console.log(`   Root: ${root.toString()}`);
        console.log(`   Depth: ${depth.toString()}`);
        console.log(`   Size: ${size.toString()}`);
        console.log(`   Members: ${members.length}`);

        return res.status(200).json({
            groupId: parseInt(groupId),
            root: root.toString(),
            depth: depth.toString(),
            size: size.toString(),
            members: members.map((m) => m.toString()),
        });
    } catch (error) {
        console.error("❌ Error fetching members:", error);

        return res.status(500).json({
            error: "Failed to fetch members",
            message: error.message,
        });
    }
});

export default router;
