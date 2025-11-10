/**
 * Relayer API Client
 * Handles communication with the backend relayer server
 */

const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || 'http://localhost:3001';

/**
 * Join the Semaphore group via the relayer
 * @param {string} identityCommitment - The identity commitment to add to the group
 * @param {number} groupId - The group ID (optional, defaults to 1)
 * @returns {Promise<{success: boolean, transactionHash: string, blockNumber: number}>}
 */
export async function joinGroupViaRelayer(identityCommitment, groupId = 1) {
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
 * @param {number} params.groupId - Group ID (optional, defaults to 0 for "Invisible Garden")
 * @returns {Promise<{success: boolean, transactionHash: string, blockNumber: number}>}
 */
export async function sendFeedbackViaRelayer({ content, groupId = 0 }) {
  try {
    console.log('🔄 Calling relayer to create post...');
    
    const response = await fetch(`${RELAYER_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        groupId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to create post');
    }

    const result = await response.json();
    console.log('✅ Post created successfully:', result);
    
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
