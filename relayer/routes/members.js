import express from "express";
import {Contract, JsonRpcProvider} from "ethers";
import {groupMembersCache} from "./join.js";
import {readFileSync} from "fs";
import {fileURLToPath} from "url";
import {dirname, join} from "path";
import {getIdentityCommitmentsInOrder} from "../utils/mongodb.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Semaphore contract address on Arbitrum Sepolia
const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";

router.get("/:groupId", async (req, res) => {
    try {
        const {groupId} = req.params;

        console.log(`🔵 Fetching members for group ${groupId}...`);

        // IMPORTANT: We use an in-memory cache for members because:
        // 1. Event scanning (SemaphoreEthers/Subgraph) hits RPC rate limits on free tier
        // 2. Querying from block 0 times out on large chains
        // 3. The cache is populated when users join via our relayer (/api/join endpoint)
        //
        // Limitation: Members who joined BEFORE this relayer was deployed or through
        // other means (direct contract calls, other relayers) won't appear in the cache.
        // For production, consider using a persistent database or The Graph hosted service.

        let members = [];

        // First, try to load from set-ordered-members.json file (source of truth)
        try {
            const jsonPath = join(__dirname, "../../set-ordered-members.json");
            const jsonData = JSON.parse(readFileSync(jsonPath, "utf8"));
            if (jsonData.groupId === groupId || jsonData.groupId === groupId.toString()) {
                members =  await getIdentityCommitmentsInOrder() || [];
                console.log(`   Found ${members.length} members in set-ordered-members.json`);
            }
        } catch (jsonError) {
            // File doesn't exist or doesn't match groupId - that's okay, fall back to cache
            console.log(`   No set-ordered-members.json found or doesn't match groupId, using cache`);
        }

        // If no members from JSON file, fall back to cache
        if (members.length === 0) {
            const cached = groupMembersCache.get(groupId);
            // Handle both Set (old format) and Array (new ordered format)
            members = cached
                ? (Array.isArray(cached) ? cached : Array.from(cached))
                : [];
            console.log(`   Found ${members.length} members in cache`);
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
