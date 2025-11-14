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
 * @param {string} params.title - The post title
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
  title,
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
        title,
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

export async function voteOnPostViaRelayer({
  groupId,
  postId,
  identityCommitment,
  isUpvote = true,
}) {
  try {
    console.log("🔄 Calling relayer to submit vote...");

    const response = await fetch(`${RELAYER_URL}/api/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        groupId,
        postId,
        identityCommitment,
        isUpvote,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || "Failed to submit vote");
    }

    const result = await response.json();
    console.log("✅ Vote submitted via relayer:", result);
    return result;
  } catch (error) {
    console.error("❌ Error calling relayer (vote):", error);
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

/**
 * Verify if an identity commitment exists in the database
 * This checks the MongoDB database first (single source of truth),
 * with blockchain fallback if database is unavailable
 * @param {string|BigInt} identityCommitment - The identity commitment to check
 * @param {number} groupId - The group ID (optional, uses DEFAULT_GROUP_ID from constants)
 * @returns {Promise<{success: boolean, isMember: boolean, identityCommitment: string, groupId: string, source: string}>}
 */
export async function verifyCommitmentOnChain(identityCommitment, groupId = DEFAULT_GROUP_ID) {
  try {
    console.log('🔍 Verifying commitment in database...');
    console.log('   Commitment:', identityCommitment);
    console.log('   Group ID:', groupId);

    const response = await fetch(
      `${RELAYER_URL}/api/check-member?identityCommitment=${identityCommitment}&groupId=${groupId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to verify commitment');
    }

    const result = await response.json();
    console.log('✅ Verification result:', result);
    console.log('   Source:', result.source || 'database');

    return result;
  } catch (error) {
    console.error('❌ Error verifying commitment:', error);
    throw error;
  }
}
