import {MongoClient} from "mongodb";

/**
 * Retrieves all identity commitments from the Commitments collection
 * ordered from oldest to newest based on timestamp
 * 
 * @param {string} mongoUri - MongoDB connection URI (optional, uses env var if not provided)
 * @returns {Promise<Array<string>>} Array of identity commitments in chronological order
 * @throws {Error} If connection or query fails
 */
export async function getIdentityCommitmentsInOrder(mongoUri = process.env.MONGODB_URI) {
    let mongoClient;
    
    try {
        console.log("🔵 Connecting to MongoDB to retrieve identity commitments...");
        
        const clientOptions = {
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 30000,
            retryWrites: true,
            retryReads: true,
        };
        
        mongoClient = new MongoClient(mongoUri, clientOptions);
        await mongoClient.connect();
        console.log("✅ MongoDB client connected");

        const database = mongoClient.db("OMBU");
        const collection = database.collection("Commitments");

        console.log("🔵 Querying identity commitments...");
        
        // Find all documents, sort by timestamp ascending (oldest first)
        // Project only the identityCommitment field
        const documents = await collection
            .find({})
            .sort({ timestamp: 1 }) // 1 for ascending order (oldest first)
            .project({ identityCommitment: 1, _id: 0, timestamp: 1 })
            .toArray();

        console.log(`✅ Retrieved ${documents.length} identity commitments`);
        
        // Extract just the identityCommitment values
        const identityCommitments = documents.map(doc => doc.identityCommitment);
        
        // Log first and last for verification
        if (identityCommitments.length > 0) {
            console.log("   First commitment:", identityCommitments[0]);
            console.log("   Last commitment:", identityCommitments[identityCommitments.length - 1]);
        }
        
        return identityCommitments;
        
    } catch (error) {
        console.error("❌ Error retrieving identity commitments from MongoDB:");
        console.error("   Error message:", error.message);
        console.error("   Error name:", error.name);
        console.error("   Error code:", error.code);
        
        // Provide helpful diagnostic information
        if (error.message?.includes("SSL") || error.message?.includes("TLS")) {
            console.error("   🔍 SSL/TLS Error detected. Common causes:");
            console.error("      - IP address not whitelisted on MongoDB Atlas");
            console.error("      - Invalid or malformed connection string");
            console.error("      - Network/firewall blocking TLS connection");
        } else if (error.name === "MongoServerSelectionError" || error.code === "ENOTFOUND") {
            console.error("   🔍 Connection Error detected. Common causes:");
            console.error("      - MongoDB instance is down or unreachable");
            console.error("      - IP address not whitelisted on MongoDB Atlas");
            console.error("      - Invalid connection string hostname");
        }
        
        throw error;
        
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
}

/**
 * Retrieves identity commitments for a specific group ID
 * ordered from oldest to newest based on timestamp
 * 
 * @param {number} groupId - The group ID to filter by
 * @param {string} mongoUri - MongoDB connection URI (optional, uses env var if not provided)
 * @returns {Promise<Array<string>>} Array of identity commitments in chronological order
 * @throws {Error} If connection or query fails
 */
export async function getIdentityCommitmentsByGroup(groupId, mongoUri = process.env.MONGODB_URI) {
    let mongoClient;
    
    try {
        console.log(`🔵 Connecting to MongoDB to retrieve identity commitments for group ${groupId}...`);
        
        const clientOptions = {
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 30000,
            retryWrites: true,
            retryReads: true,
        };
        
        mongoClient = new MongoClient(mongoUri, clientOptions);
        await mongoClient.connect();
        console.log("✅ MongoDB client connected");

        const database = mongoClient.db("OMBU");
        const collection = database.collection("Commitments");

        console.log(`🔵 Querying identity commitments for group ${groupId}...`);
        
        // Find documents for specific group, sort by timestamp ascending
        const documents = await collection
            .find({ groupId: groupId })
            .sort({ timestamp: 1 })
            .project({ identityCommitment: 1, _id: 0, timestamp: 1 })
            .toArray();

        console.log(`✅ Retrieved ${documents.length} identity commitments for group ${groupId}`);
        
        const identityCommitments = documents.map(doc => doc.identityCommitment);
        
        if (identityCommitments.length > 0) {
            console.log("   First commitment:", identityCommitments[0]);
            console.log("   Last commitment:", identityCommitments[identityCommitments.length - 1]);
        }
        
        return identityCommitments;
        
    } catch (error) {
        console.error(`❌ Error retrieving identity commitments for group ${groupId} from MongoDB:`);
        console.error("   Error message:", error.message);
        throw error;
        
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
}