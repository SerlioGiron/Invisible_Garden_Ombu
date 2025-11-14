import express from 'express';
import { Contract, JsonRpcProvider } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient } from 'mongodb';
import { OMBU_CONTRACT_ADDRESS } from '../../src/config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Load contract ABI
const abiPath = join(__dirname, '../Ombu.json');
let OmbuArtifact;
try {
  OmbuArtifact = JSON.parse(readFileSync(abiPath, 'utf8'));
} catch (error) {
  console.error('❌ Error loading contract ABI:', error.message);
  console.error('   Make sure to compile contracts with: forge build');
}

router.get('/', async (req, res) => {
  let mongoClient;

  try {
    const { identityCommitment, groupId } = req.query;

    // Validate input
    if (!identityCommitment) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'identityCommitment is required'
      });
    }

    if (!groupId) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'groupId is required'
      });
    }

    // Check MongoDB database (single source of truth)
    try {
      const clientOptions = {
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
        retryWrites: true,
        retryReads: true,
      };

      mongoClient = new MongoClient(process.env.MONGODB_URI, clientOptions);
      await mongoClient.connect();

      const database = mongoClient.db('OMBU');
      const collection = database.collection('Commitments');

      // Query for the specific identityCommitment in the group
      const document = await collection.findOne({
        groupId: parseInt(groupId),
        identityCommitment: identityCommitment
      });

      const isMemberInDB = !!document;

      return res.status(200).json({
        success: true,
        isMember: isMemberInDB,
        groupId: groupId,
        identityCommitment: identityCommitment,
        source: 'database',
        transactionHash: document?.transactionHash || null
      });

    } catch (mongoError) {
      console.error('❌ MongoDB error:', mongoError.message);

      // If MongoDB fails, fall back to blockchain check
      console.log('⚠️ Falling back to blockchain verification...');

      // Validate that the ABI is loaded
      if (!OmbuArtifact || !OmbuArtifact.abi) {
        return res.status(500).json({
          error: 'Database unavailable and contract ABI not loaded',
          details: 'Cannot verify membership'
        });
      }

      const provider = new JsonRpcProvider(process.env.RPC_URL);
      const contract = new Contract(
        OMBU_CONTRACT_ADDRESS,
        OmbuArtifact.abi,
        provider
      );

      const isMember = await contract.isGroupMember(groupId, identityCommitment);

      return res.status(200).json({
        success: true,
        isMember: isMember,
        groupId: groupId,
        identityCommitment: identityCommitment,
        source: 'blockchain',
        warning: 'Database unavailable, using blockchain as fallback'
      });
    }

  } catch (error) {
    console.error('❌ Error in checkMember route:', error);

    // Handle specific ethers errors
    let errorMessage = error.message;
    if (error.code === 'CALL_EXCEPTION') {
      errorMessage = 'Smart contract call failed. Check if group exists.';
    }

    return res.status(500).json({
      error: 'Query failed',
      message: errorMessage,
      code: error.code
    });
  } finally {
    if (mongoClient) {
      try {
        await mongoClient.close();
      } catch (closeError) {
        console.warn('⚠️ Error closing MongoDB connection:', closeError.message);
      }
    }
  }
});

export default router;
