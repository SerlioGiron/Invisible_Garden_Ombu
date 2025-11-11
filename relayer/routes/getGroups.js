import express from 'express';
import { Contract, JsonRpcProvider } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
  try {
    // Validate that the ABI is loaded
    if (!OmbuArtifact || !OmbuArtifact.abi) {
      return res.status(500).json({
        error: 'Contract ABI not loaded',
        details: 'Run "forge build" to compile contracts'
      });
    }

    // Configure provider (no need for signer because it's a read-only call)
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const contract = new Contract(
      process.env.CONTRACT_ADDRESS,
      OmbuArtifact.abi,
      provider
    );

    console.log('📋 Fetching groups array...');
    console.log('   Contract:', process.env.CONTRACT_ADDRESS);

    // Get the number of groups first
    const groupCounter = await contract.groupCounter();
    console.log('   Total groups:', groupCounter.toString());

    // Get all groups from the array
    const groups = [];
    for (let i = 0; i < Number(groupCounter); i++) {
      const groupId = await contract.groups(i);
      groups.push(groupId.toString());
    }

    // Get the names of the groups
    const groupsWithNames = await Promise.all(
      groups.map(async (groupId) => {
        const name = await contract.groupNames(groupId);
        return {
          groupId: groupId,
          name: name
        };
      })
    );

    console.log('✅ Groups fetched successfully:', groups);

    return res.status(200).json({
      success: true,
      totalGroups: Number(groupCounter),
      groups: groupsWithNames
    });

  } catch (error) {
    console.error('❌ Error in getGroups route:', error);

    // Handle specific ethers errors
    let errorMessage = error.message;
    if (error.code === 'CALL_EXCEPTION') {
      errorMessage = 'Smart contract call failed. Check contract address.';
    }

    return res.status(500).json({
      error: 'Query failed',
      message: errorMessage,
      code: error.code
    });
  }
});

export default router;
