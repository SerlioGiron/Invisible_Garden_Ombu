/**
 * Relayer API Client
 * Handles communication with the backend relayer server
 */

import { DEFAULT_GROUP_ID } from '../config/constants.js';

const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || 'http://localhost:3001';

/**
 * Join the Semaphore group via the relayer
 * @param {string} identityCommitment - The identity commitment to add to the group
 * @param {number} groupId - The group ID (optional, uses DEFAULT_GROUP_ID from constants)
 * @returns {Promise<{success: boolean, transactionHash: string, blockNumber: number}>}
 */
export async function joinGroupViaRelayer(identityCommitment, groupId = DEFAULT_GROUP_ID) {
  try {
    console.log('🔄 Calling relayer to join group...');
    
    const response = await fetch(`${RELAYER_URL}/api/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identityCommitment, groupId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to join group');
    }

    const result = await response.json();
    console.log('✅ Successfully joined group:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error calling relayer (join):', error);
    throw error;
  }
}

/**
 * Send feedback via the relayer (creates a main post)
 * @param {Object} params - Post parameters
 * @param {string} params.content - The post content/message
 * @param {number} params.groupId - Group ID
 * @param {string|number} params.feedback - The feedback signal (uint256) used in the Semaphore proof
 * @param {number} params.merkleTreeDepth - The depth of the Merkle tree
 * @param {string} params.merkleTreeRoot - The root of the Merkle tree
 * @param {string} params.nullifier - The nullifier to prevent double-spending
 * @param {number[]} params.points - The proof points array (8 uint256 values)
 * @returns {Promise<{success: boolean, transactionHash: string, blockNumber: number}>}
 */
export async function sendFeedbackViaRelayer({ 
  content, 
  groupId, 
  feedback, 
  merkleTreeDepth, 
  merkleTreeRoot, 
  nullifier, 
  points 
}) {
  try {
    console.log('🔄 Calling relayer to create post...');
    
    const response = await fetch(`${RELAYER_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        groupId,
        feedback,
        merkleTreeDepth,
        merkleTreeRoot,
        nullifier,
        points
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to create post');
    }

    const result = await response.json();
    console.log('✅ Post created successfully:', result);
    console.log('Transaction hash:', result.transactionHash);
    
    return result;
  } catch (error) {
    console.error('❌ Error calling relayer (feedback):', error);
    throw error;
  }
}

/**
 * Check if the relayer is online and healthy
 * @returns {Promise<{status: string, message: string}>}
 */
export async function checkRelayerHealth() {
  try {
    const response = await fetch(`${RELAYER_URL}/health`);
    
    if (!response.ok) {
      throw new Error('Relayer health check failed');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Relayer health check failed:', error);
    throw new Error('Relayer server is not available. Make sure it is running.');
  }
}
