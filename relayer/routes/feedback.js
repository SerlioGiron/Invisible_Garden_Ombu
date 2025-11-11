import express from 'express';
import {validateABI, getContract, handleError} from "../utils/contract.js";

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
    console.log('   Contract:', process.env.CONTRACT_ADDRESS);

    // Verify signer balance
    const balance = await provider.getBalance(signer.address);
    console.log('   Relayer balance:', balance.toString());

    if (balance === 0n) {
      return res.status(500).json({
        error: 'Insufficient funds',
        details: 'Relayer wallet has no funds to pay for gas'
      });
    }

    // Execute transaction
    // Note: feedback must be the exact uint256 value used when generating the Semaphore proof on the client side
    const transaction = await contract.sendFeedback(
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
    return handleError(error, res);
  }
});

export default router;
