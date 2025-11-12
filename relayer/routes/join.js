import express from "express";
import {Contract, JsonRpcProvider, Wallet, Interface} from "ethers";
import {readFileSync} from "fs";
import {fileURLToPath} from "url";
import {dirname, join} from "path";
import {MongoClient} from "mongodb";
import {getIdentityCommitmentsInOrder} from "../utils/mongodb.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Import the shared cache from members.js
// Note: This is a simple in-memory cache that persists across requests
export const groupMembersCache = new Map();

// Load contract ABI
const abiPath = join(__dirname, "../Ombu.json");
let OmbuArtifact;
try {
    OmbuArtifact = JSON.parse(readFileSync(abiPath, "utf8"));
} catch (error) {
    console.error("❌ Error loading contract ABI:", error.message);
    console.error("   Make sure to compile contracts with: forge build");
}

router.post("/", async (req, res) => {
    console.log("🔵 ========== JOIN ROUTE CALLED ==========");
    console.log("🔵 Request body:", JSON.stringify(req.body, null, 2));

    try {
        const {identityCommitment, groupId} = req.body;

        // Validate input
        if (!identityCommitment) {
            console.error("❌ Missing identityCommitment");
            return res.status(400).json({
                error: "Missing required parameter",
                details: "identityCommitment is required",
            });
        }

        console.log("✅ Identity commitment received:", identityCommitment);

        // Validate that the ABI is loaded
        if (!OmbuArtifact || !OmbuArtifact.abi) {
            console.error("❌ Contract ABI not loaded");
            return res.status(500).json({
                error: "Contract ABI not loaded",
                details: 'Run "forge build" to compile contracts',
            });
        }
        console.log("✅ Contract ABI loaded");

        // Configure provider and signer
        console.log("🔵 Configuring provider and signer...");
        console.log("   RPC_URL:", process.env.RPC_URL ? "Set" : "NOT SET");
        console.log("   PRIVATE_KEY:", process.env.PRIVATE_KEY ? "Set" : "NOT SET");
        console.log("   CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS || "NOT SET");

        const provider = new JsonRpcProvider(process.env.RPC_URL);
        const signer = new Wallet(process.env.PRIVATE_KEY, provider);
        console.log("✅ Provider and signer configured");
        console.log("   Signer address:", signer.address);

        const contract = new Contract(process.env.CONTRACT_ADDRESS, OmbuArtifact.abi, signer);
        console.log("✅ Contract instance created");
        console.log("   Contract address:", process.env.CONTRACT_ADDRESS);

        // Get the latest Semaphore group ID from the Ombu contract (last group in groups array)
        console.log("🔵 Fetching latest group ID from contract...");
        let selectedGroupId;
        try {
            console.log("   Calling contract.groupCounter()...");
            const groupCounter = await contract.groupCounter();
            const groupCounterNum = Number(groupCounter);
            console.log("✅ Group counter:", groupCounterNum);

            if (groupCounterNum === 0) {
                console.error("❌ No groups exist in contract");
                return res.status(400).json({
                    error: "No groups exist",
                    details: "The contract has no groups. The contract needs to be deployed and initialized first.",
                });
            }

            // Get the latest group (last index = groupCounter - 1)
            const latestGroupIndex = groupCounterNum - 1;
            console.log("   Fetching latest group at index:", latestGroupIndex);
            console.log("   Calling contract.groups(", latestGroupIndex, ")...");
            const latestGroupId = await contract.groups(latestGroupIndex);
            selectedGroupId = Number(latestGroupId);
            console.log("✅ Latest Semaphore group ID from contract:", selectedGroupId);
            console.log("   (This is group index", latestGroupIndex, "out of", groupCounterNum, "total groups)");
        } catch (error) {
            console.error("❌ Error fetching group ID from contract:");
            console.error("   Error message:", error.message);
            console.error("   Error code:", error.code);
            console.error("   Error data:", error.data);
            return res.status(500).json({
                error: "Failed to fetch group ID",
                details: `Could not fetch group ID from contract: ${error.message}. Make sure the contract is deployed and has groups.`,
                errorCode: error.code,
            });
        }

        console.log("📝 Joining group...");
        console.log("   Semaphore Group ID:", selectedGroupId);
        console.log("   Identity Commitment:", identityCommitment);
        console.log("   Contract:", process.env.CONTRACT_ADDRESS);

        // Verify signer balance
        console.log("🔵 Checking relayer balance...");
        const balance = await provider.getBalance(signer.address);
        console.log("   Relayer balance:", balance.toString(), "wei");
        console.log("   Relayer balance (ETH):", (Number(balance) / 1e18).toFixed(6), "ETH");

        if (balance === 0n) {
            console.error("❌ Relayer has no funds");
            return res.status(500).json({
                error: "Insufficient funds",
                details: "Relayer wallet has no funds to pay for gas",
            });
        }

        // Verify the group exists in Semaphore before trying to add members
        console.log("🔵 Verifying group exists in Semaphore...");
        try {
            // Use the Semaphore contract directly to check if group exists
            // Semaphore contract address on Arbitrum Sepolia
            const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";
            const semaphoreGroupsABI = [
                {
                    inputs: [{name: "groupId", type: "uint256"}],
                    name: "getMerkleTreeRoot",
                    outputs: [{name: "", type: "uint256"}],
                    stateMutability: "view",
                    type: "function",
                },
            ];
            const semaphoreContract = new Contract(SEMAPHORE_ADDRESS, semaphoreGroupsABI, provider);

            console.log("   Checking if group", selectedGroupId, "exists in Semaphore...");
            const merkleRoot = await semaphoreContract.getMerkleTreeRoot(selectedGroupId);
            console.log("✅ Group exists in Semaphore!");
            console.log("   Merkle tree root:", merkleRoot.toString());
        } catch (semaphoreCheckError) {
            console.error("❌ Group does NOT exist in Semaphore:");
            console.error("   Error:", semaphoreCheckError.message);
            console.error("   Group ID from Ombu contract:", selectedGroupId);
            console.error("   This means the Ombu contract's stored group ID doesn't match Semaphore");

            return res.status(500).json({
                error: "Group does not exist in Semaphore",
                details: `The group ID ${selectedGroupId} stored in the Ombu contract does not exist in Semaphore. This usually means the contract wasn't properly initialized or the group was deleted. Please verify the contract deployment and group creation.`,
                groupId: selectedGroupId,
                contractAddress: process.env.CONTRACT_ADDRESS,
            });
        }

        // const receipt = await provider.getTransactionReceipt("0x2d80556ba0049ab8354160a763ec802c5251f2f3b19de195cfe25bab367e51a7");
        // console.log("receipt: ", receipt.logs);

        // Verify if the user is already a member
        console.log("🔵 Checking if user is already a member...");
        try {
            console.log("   Calling contract.isGroupMember(", selectedGroupId, ",", identityCommitment, ")...");
            const isMember = await contract.isGroupMember(selectedGroupId, identityCommitment);
            console.log("✅ Is already member:", isMember);

            if (isMember) {
                console.log("✅ User is already a member, returning success");

                // Add to cache even if already a member (in case cache was cleared)
                if (!groupMembersCache.has(selectedGroupId)) {
                    groupMembersCache.set(selectedGroupId, new Set());
                }
                groupMembersCache.get(selectedGroupId).add(identityCommitment);
                console.log("✅ Added existing member to cache for group", selectedGroupId);

                return res.status(200).json({
                    success: true,
                    message: "Already a member",
                    details: "This identity commitment is already a member of the group",
                    groupId: selectedGroupId,
                });
            }
        } catch (checkError) {
            console.warn("⚠️  Could not verify membership status:");
            console.warn("   Error:", checkError.message);
            console.warn("   Continuing anyway...");
            // Continue anyway - the transaction will fail if there's a real issue
        }

        // Execute transaction
        console.log("🔵 Executing transaction to add member...");
        console.log("   Calling contract.addMember(", selectedGroupId, ",", identityCommitment, ")...");

        try {
            const transaction = await contract.addMember(selectedGroupId, identityCommitment);
            console.log("✅ Transaction sent successfully");
            console.log("   Transaction hash:", transaction.hash);
            console.log("   Waiting for confirmation...");

            const receipt = await transaction.wait();
            console.log("✅ Transaction confirmed!");
            console.log("   Block number:", receipt.blockNumber);
            console.log("   Gas used:", receipt.gasUsed.toString());
            console.log("   Status:", receipt.status === 1 ? "Success" : "Failed");

            const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";
            const MemberAddedEventAbi = "event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)";
            const iface = new Interface([MemberAddedEventAbi]);
            
            let memberAddedEvent = null;
            let eventData = null;
            
            // Find the MemberAdded event from Semaphore contract
            for (const log of receipt.logs) {
                if (log.address.toLowerCase() === SEMAPHORE_ADDRESS.toLowerCase()) {
                    try {
                        const parsed = iface.parseLog({
                            topics: log.topics,
                            data: log.data
                        });
                        
                        if (parsed && parsed.name === "MemberAdded") {
                            memberAddedEvent = parsed;
                            eventData = {
                                index: parsed.args.index.toString(),
                                identityCommitment: parsed.args.identityCommitment.toString(),
                                merkleTreeRoot: parsed.args.merkleTreeRoot.toString()
                            };
                            console.log("✅ Found MemberAdded event:");
                            console.log("   Index:", eventData.index);
                            console.log("   Identity Commitment:", eventData.identityCommitment);
                            console.log("   Merkle Tree Root:", eventData.merkleTreeRoot);
                            break;
                        }
                    } catch (parseError) {
                        continue;
                    }
                }
            }
            
            if (memberAddedEvent && eventData) {

                // Store in MongoDB
                let mongoClient;
                try {
                    console.log("🔵 Connecting to MongoDB...");
                    console.log("   MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "NOT SET");
                    
                    const clientOptions = {
                        // Connection timeouts
                        connectTimeoutMS: 30000,
                        serverSelectionTimeoutMS: 30000,
                        // Retry configuration
                        retryWrites: true,
                        retryReads: true,
                    };
                    
                    mongoClient = new MongoClient(process.env.MONGODB_URI, clientOptions);
                    await mongoClient.connect();
                    console.log("✅ MongoDB client connected");

                    const database = mongoClient.db("OMBU");
                    const collection = database.collection("Commitments");

                    const document = {
                        groupId: selectedGroupId,
                        identityCommitment: identityCommitment, 
                        transactionHash: receipt.hash,
                        blockNumber: receipt.blockNumber,
                        merkleTreeData: {
                            index: eventData.index, 
                            identityCommitment: eventData.identityCommitment,   
                            merkleTreeRoot: eventData.merkleTreeRoot 
                        },
                        timestamp: new Date(),
                    };

                    console.log("🔵 Inserting document into MongoDB...");
                    const result = await collection.insertOne(document);
                    console.log("✅ Document inserted with _id:", result.insertedId);

                } catch (mongoError) {
                    console.error("❌ MongoDB error:");
                    console.error("   Error message:", mongoError.message);
                    console.error("   Error stack:", mongoError.stack);
                    console.error("   Error name:", mongoError.name);
                    console.error("   Error code:", mongoError.code);
                    
                    // Provide helpful diagnostic information
                    if (mongoError.message?.includes("SSL") || mongoError.message?.includes("TLS") || 
                        mongoError.message?.includes("alert")) {
                        console.error("   🔍 SSL/TLS Error detected. Common causes:");
                        console.error("      - IP address not whitelisted on MongoDB Atlas");
                        console.error("      - Invalid or malformed connection string");
                        console.error("      - Network/firewall blocking TLS connection");
                        console.error("      - Node.js TLS version incompatibility");
                    } else if (mongoError.name === "MongoServerSelectionError" || 
                               mongoError.code === "ENOTFOUND") {
                        console.error("   🔍 Connection Error detected. Common causes:");
                        console.error("      - MongoDB instance is down or unreachable");
                        console.error("      - IP address not whitelisted on MongoDB Atlas");
                        console.error("      - Invalid connection string hostname");
                        console.error("      - Network connectivity issues");
                    }
                    
                } finally {
                    if (mongoClient) {
                        try {
                            await mongoClient.close();
                            console.log("✅ MongoDB connection closed");
                        } catch (closeError) {
                            console.warn("⚠️  Error closing MongoDB connection:", closeError.message);
                        }
                    }
                }
            } else {
                console.warn("⚠️  MemberAdded event not found in transaction logs");
            }

            if (!groupMembersCache.has(selectedGroupId)) {
                groupMembersCache.set(selectedGroupId, new Set());
            }
            groupMembersCache.get(selectedGroupId).add(identityCommitment);
            console.log("✅ Added member to cache for group", selectedGroupId);
            console.log("   Cache now has", groupMembersCache.get(selectedGroupId).size, "members");
            const identityCommitments = await getIdentityCommitmentsInOrder(selectedGroupId);
            console.log("Identity commitments: ", identityCommitments);

            return res.status(200).json({
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                groupId: selectedGroupId,
            });
        } catch (txError) {
            console.error("❌ Transaction failed:");
            console.error("   Error message:", txError.message);
            console.error("   Error code:", txError.code);
            console.error("   Error data:", txError.data);
            console.error("   Error info:", JSON.stringify(txError.info, null, 2));

            // Re-throw to be handled by outer catch
            throw txError;
        }
    } catch (error) {
        console.error("❌ ========== ERROR IN JOIN ROUTE ==========");
        console.error("❌ Error type:", error.constructor.name);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error code:", error.code);
        console.error("❌ Error data:", error.data);
        console.error("❌ Error info:", JSON.stringify(error.info, null, 2));
        console.error("❌ Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

        // Handle specific ethers errors
        let errorMessage = error.message;
        let errorDetails = null;

        if (error.code === "INSUFFICIENT_FUNDS") {
            errorMessage = "Relayer wallet has insufficient funds for gas";
            errorDetails = `Relayer address: ${error.transaction?.from || "unknown"}`;
        } else if (error.code === "CALL_EXCEPTION" || error.code === "ACTION_REJECTED") {
            // Decode custom error
            const errorData = error.data || error.info?.error?.data || error.reason;

            console.error("   Error data (hex):", errorData);

            // Error selector 0xbb9bf278 = Semaphore__GroupDoesNotExist()
            if (errorData === "0xbb9bf278" || error.message?.includes("Group does not exist") || error.reason?.includes("Group does not exist")) {
                errorMessage = "Group does not exist in Semaphore";
                errorDetails = `The Semaphore group ID ${req.body.groupId || "unknown"} does not exist. This usually means the contract wasn't properly initialized. Check that the contract was deployed correctly and that groups were created.`;
            } else {
                errorMessage = "Smart contract call failed";
                errorDetails = `Error data: ${errorData || error.message}. Reason: ${error.reason || "Unknown"}`;
            }
        } else if (error.message?.includes("network") || error.message?.includes("timeout")) {
            errorMessage = "Network error";
            errorDetails = "Failed to connect to the blockchain. Check your RPC_URL and network connection.";
        }

        return res.status(500).json({
            error: "Transaction failed",
            message: errorMessage,
            details: errorDetails,
            code: error.code,
            errorData: error.data || error.info?.error?.data,
            reason: error.reason,
        });
    }
});

export default router;
