import {Contract, JsonRpcProvider, ethers} from "ethers";
import "dotenv/config";
import { SEMAPHORE_CONTRACT_ADDRESS, DEFAULT_GROUP_ID } from "../src/config/constants.js";

const RPC_URL = process.env.RPC_URL;
const SEMAPHORE_ADDRESS = SEMAPHORE_CONTRACT_ADDRESS;
const GROUP_ID = DEFAULT_GROUP_ID;

async function findMembers() {
    console.log("🔍 Finding all members for group", GROUP_ID);

    const provider = new JsonRpcProvider(RPC_URL);

    // MemberAdded event signature
    const eventSignature = "MemberAdded(uint256,uint256,uint256,uint256)";
    const eventTopic = "0x19239b3f93cd10558aaf11423af70c77763bf54f52bcc75bfa74d4d13548cde9";

    // Get current block
    const currentBlock = await provider.getBlockNumber();
    console.log("   Current block:", currentBlock);

    // Try scanning last 50000 blocks (should be within RPC limits)
    const fromBlock = Math.max(0, currentBlock - 50000);
    console.log("   Scanning from block:", fromBlock);

    // Convert GROUP_ID to padded hex (32 bytes) - used in both try and catch blocks
    const groupIdHex = ethers.zeroPadValue(ethers.toBeHex(GROUP_ID), 32);

    try {
        // Query logs for MemberAdded events

        const logs = await provider.getLogs({
            address: SEMAPHORE_ADDRESS,
            topics: [
                eventTopic,
                groupIdHex  // Group ID as indexed parameter (padded to 32 bytes)
            ],
            fromBlock,
            toBlock: currentBlock
        });

        console.log(`\n✅ Found ${logs.length} MemberAdded events for group ${GROUP_ID}`);

        // Store members with their index to maintain order
        const membersWithIndex = [];

        // Semaphore ABI for decoding
        const iface = new ethers.Interface([
            "event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)"
        ]);

        for (const log of logs) {
            try {
                // Parse the log
                const parsed = iface.parseLog({
                    topics: log.topics,
                    data: log.data
                });

                const index = Number(parsed.args.index);
                const identityCommitment = parsed.args.identityCommitment.toString();

                membersWithIndex.push({
                    index,
                    identityCommitment,
                    blockNumber: log.blockNumber,
                    transactionIndex: log.transactionIndex,
                    logIndex: log.logIndex
                });

                console.log(`   [${index}] ${identityCommitment}`);
            } catch (parseError) {
                console.error("   Failed to parse log:", parseError.message);
            }
        }

        // Sort by index (which represents the order they were added to the Merkle tree)
        membersWithIndex.sort((a, b) => a.index - b.index);

        console.log(`\n📊 Total members: ${membersWithIndex.length}`);
        console.log("\n✅ Members in order:");
        membersWithIndex.forEach(m => console.log(`  [${m.index}]`, m.identityCommitment));

        return membersWithIndex.map(m => m.identityCommitment);
    } catch (error) {
        console.error("❌ Error querying logs:", error.message);
        console.error("   Trying with smaller block range...");

        // Try with just last 1000 blocks
        try {
            const smallFromBlock = Math.max(0, currentBlock - 1000);
            const logs = await provider.getLogs({
                address: SEMAPHORE_ADDRESS,
                topics: [
                    eventTopic,
                    groupIdHex  // Use the same groupIdHex from above
                ],
                fromBlock: smallFromBlock,
                toBlock: currentBlock
            });

            console.log(`✅ Found ${logs.length} events in last 1000 blocks`);
            const membersWithIndex = [];
            const iface = new ethers.Interface([
                "event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)"
            ]);

            for (const log of logs) {
                try {
                    const parsed = iface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });
                    const index = Number(parsed.args.index);
                    const identityCommitment = parsed.args.identityCommitment.toString();
                    membersWithIndex.push({ index, identityCommitment });
                    console.log(`   [${index}] ${identityCommitment}`);
                } catch (parseError) {
                    console.error("   Failed to parse:", parseError.message);
                }
            }

            membersWithIndex.sort((a, b) => a.index - b.index);
            return membersWithIndex.map(m => m.identityCommitment);
        } catch (smallRangeError) {
            console.error("❌ Even small range failed:", smallRangeError.message);
            return [];
        }
    }
}

findMembers().then(members => {
    console.log("\n🎯 Final result:", members);
    process.exit(0);
}).catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
