import {SemaphoreEthers} from "@semaphore-protocol/data";
import "dotenv/config";
import { SEMAPHORE_CONTRACT_ADDRESS, DEFAULT_GROUP_ID } from "../src/config/constants.js";

const RPC_URL = process.env.RPC_URL;
const SEMAPHORE_ADDRESS = SEMAPHORE_CONTRACT_ADDRESS;
const groupId = String(DEFAULT_GROUP_ID); // Convert to string for SemaphoreEthers

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
