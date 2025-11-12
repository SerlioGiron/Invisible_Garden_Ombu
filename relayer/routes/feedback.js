import express from 'express';
import {validateABI, getContract, handleError} from "../utils/contract.js";
import { OMBU_CONTRACT_ADDRESS } from '../../src/config/constants.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { groupId, feedback, content, merkleTreeDepth, merkleTreeRoot, nullifier, points } = req.body;

    // Validate input
    if (groupId === undefined || feedback === undefined || !merkleTreeDepth || !merkleTreeRoot || !nullifier || !content || points === undefined) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'groupId, feedback (uint256), merkleTreeDepth, merkleTreeRoot, nullifier, content, and points are required'
      });
    }

    // Validate that the ABI is loaded
    if (!validateABI(res)) return;

    // Get contract instance
    const {provider, signer, contract} = getContract();

    console.log('   Sending feedback...');
    console.log('   Group ID:', groupId);
    console.log('   Content:', content);
    console.log('   Contract:', OMBU_CONTRACT_ADDRESS);
    console.log('   Merkle Tree Depth:', merkleTreeDepth);
    console.log('   Merkle Tree Root:', merkleTreeRoot);
    console.log('   Nullifier:', nullifier);
    console.log('   Feedback:', feedback);
    console.log('   Points array length:', points?.length);
    console.log('   Points:', points);

    // Verify signer balance
    const balance = await provider.getBalance(signer.address);
    console.log('   Relayer balance:', balance.toString());

    if (balance === 0n) {
      return res.status(500).json({
        error: 'Insufficient funds',
        details: 'Relayer wallet has no funds to pay for gas'
      });
    }

    // Validate points array (must be exactly 8 uint256 values)
    if (!Array.isArray(points) || points.length !== 8) {
      return res.status(400).json({
        error: 'Invalid points array',
        details: `Points must be an array of exactly 8 uint256 values, got ${points?.length || 0}`
      });
    }

    // Execute transaction
    // Note: feedback must be the exact uint256 value used when generating the Semaphore proof on the client side
    // Using createMainPost which matches the ABI (sendFeedback in source is compiled as createMainPost)
    console.log('   Calling contract.createMainPost...');
    const transaction = await contract.createMainPost(
      groupId,
      merkleTreeDepth,
      merkleTreeRoot,
      nullifier,
      feedback,
      content,
      points
    );

    console.log('   Transaction sent:', transaction.hash);

    const receipt = await transaction.wait();
    console.log('✅ Feedback created successfully in block:', receipt.blockNumber);

    return res.status(200).json({
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });

  } catch (error) {
    console.error('❌ Error in feedback route:', error);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error data:', error.data);
    
    // Try to decode the error
    if (error.data) {
      console.error('   Error data (hex):', error.data);
      // Common Semaphore errors:
      // 0x4aa6bc40 might be related to proof validation failure
      if (error.data === '0x4aa6bc40' || error.data.startsWith('0x4aa6bc40')) {
        return res.status(500).json({
          error: 'Proof validation failed',
          details: 'The Semaphore proof validation failed. This usually means: 1) The proof was generated with a different merkle tree root than what exists on-chain, 2) The group ID is incorrect, 3) The proof parameters are invalid, or 4) The identity commitment is not a member of the group.',
          errorData: error.data,
          suggestion: 'Verify that the local group members match the on-chain group members exactly, and that the proof was generated with the correct group data.'
        });
      }
    }
    
    return handleError(error, res);
  }
});

export default router;
