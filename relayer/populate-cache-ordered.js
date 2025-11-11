import {Contract, JsonRpcProvider, ethers} from "ethers";
import "dotenv/config";
import {groupMembersCache} from "./routes/join.js";

const RPC_URL = process.env.RPC_URL;
const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";
const GROUP_ID = 4;

async function populateCacheInOrder() {
    console.log("🔄 Populating cache with members in correct order...\n");

    const provider = new JsonRpcProvider(RPC_URL);
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 50000);

    console.log(`📡 Scanning blocks ${fromBlock} to ${currentBlock}`);

    const eventTopic = "0x19239b3f93cd10558aaf11423af70c77763bf54f52bcc75bfa74d4d13548cde9";

    const logs = await provider.getLogs({
        address: SEMAPHORE_ADDRESS,
        topics: [
            eventTopic,
            "0x0000000000000000000000000000000000000000000000000000000000000004"
        ],
        fromBlock,
        toBlock: currentBlock
    });

    console.log(`✅ Found ${logs.length} MemberAdded events\n`);

    const membersWithIndex = [];
    const iface = new ethers.Interface([
        "event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)"
    ]);

    for (const log of logs) {
        const parsed = iface.parseLog({
            topics: log.topics,
            data: log.data
        });

        const index = Number(parsed.args.index);
        const identityCommitment = parsed.args.identityCommitment.toString();

        membersWithIndex.push({ index, identityCommitment });
    }

    // Sort by index
    membersWithIndex.sort((a, b) => a.index - b.index);

    console.log("📋 Members in correct order:");
    membersWithIndex.forEach(m => console.log(`   [${m.index}] ${m.identityCommitment}`));

    // Clear and repopulate cache
    console.log("\n🔄 Clearing existing cache...");
    groupMembersCache.delete(GROUP_ID);
    groupMembersCache.delete(GROUP_ID.toString());
    groupMembersCache.delete("4");

    console.log("✅ Cache cleared");

    console.log("\n📝 Populating cache with ordered members...");

    // Create array instead of Set to maintain order
    const orderedMembers = membersWithIndex.map(m => m.identityCommitment);
    groupMembersCache.set("4", orderedMembers);

    console.log(`✅ Cache populated with ${orderedMembers.length} members in correct order`);

    console.log("\n✅ Done! Cache is now properly ordered.");
    console.log("\nYou can verify by visiting: http://localhost:3001/api/members/4");
}

populateCacheInOrder().catch(error => {
    console.error("❌ Error:", error);
    process.exit(1);
});
