import {SemaphoreEthers} from "@semaphore-protocol/data";
import "dotenv/config";

const RPC_URL = process.env.RPC_URL;
const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";
const groupId = "0"; // Test with group ID 0

async function testSemaphoreEthers() {
    console.log("🔵 Testing SemaphoreEthers...");
    console.log("   RPC URL:", RPC_URL);
    console.log("   Semaphore Address:", SEMAPHORE_ADDRESS);
    console.log("   Group ID:", groupId);

    try {
        const semaphoreEthers = new SemaphoreEthers(RPC_URL, {
            address: SEMAPHORE_ADDRESS
        });
        console.log("✅ SemaphoreEthers instance created");

        console.log("\n🔵 Fetching group members...");
        console.log("   This may take a while (scanning blockchain events)...");

        const startTime = Date.now();
        const members = await semaphoreEthers.getGroupMembers(groupId);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log("✅ Members fetched successfully!");
        console.log("   Count:", members.length);
        console.log("   Members:", members);
        console.log("   Duration:", duration, "seconds");
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("   Full error:", error);
        console.error("   Stack:", error.stack);
    }
}

testSemaphoreEthers();
