/**
 * Semaphore Proof Generation Utility
 * Generates zero-knowledge proofs for anonymous posting
 */

import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";

/**
 * Check if user has a valid Semaphore identity (both commitment and signature)
 * @returns {boolean} True if identity is complete, false otherwise
 */
export function hasValidSemaphoreIdentity() {
  if (typeof window === "undefined") {
    return false;
  }

  const storedCommitment = localStorage.getItem("ombuSemaphoreCommitment");
  const storedSignature = localStorage.getItem("ombuSemaphoreSignature");
  
  return !!(storedCommitment && storedSignature);
}

/**
 * Get Semaphore identity from localStorage using the stored signature
 * @returns {Identity|null} The Semaphore identity or null if not found
 */
export function getSemaphoreIdentityFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedSignature = localStorage.getItem("ombuSemaphoreSignature");
  if (!storedSignature) {
    console.warn("No Semaphore identity signature found in localStorage");
    return null;
  }

  try {
    // Reconstruct the identity from the stored signature
    const identity = new Identity(storedSignature);
    return identity;
  } catch (error) {
    console.error("Error reconstructing Semaphore identity:", error);
    return null;
  }
}

/**
 * Generate Semaphore proof for anonymous posting
 * @param {Identity} identity - The Semaphore identity
 * @param {number} groupId - The Semaphore group ID
 * @param {string|number} signal - The signal/message (can be content hash or arbitrary uint256)
 * @param {Object} groupData - The group data including members and merkle tree root
 * @returns {Promise<Object>} The proof data including merkleTreeDepth, merkleTreeRoot, nullifier, feedback, and points
 */
export async function generateSemaphoreProof(identity, groupId, signal, groupData) {
  try {
    if (!identity) {
      throw new Error("Semaphore identity is required");
    }

    console.log("🔍 Proof generation - groupData received:", JSON.stringify(groupData, null, 2));
    console.log("🔍 Proof generation - members type:", typeof groupData.members);
    console.log("🔍 Proof generation - members isArray:", Array.isArray(groupData.members));
    console.log("🔍 Proof generation - members value:", groupData.members);

    // Dynamic import to avoid issues if package is not installed
    const { generateProof } = await import("@semaphore-protocol/proof");

    // Convert signal to uint256 (BigInt)
    // For Semaphore, the signal can be any uint256 value
    // We'll use a hash of the content string, or use the signal directly if it's already a number
    let feedback;
    if (typeof signal === "string") {
      // Simple hash: convert string to bytes, take first 32 bytes, convert to BigInt
      // Note: This is a simple approach. For production, consider using keccak256
      const encoder = new TextEncoder();
      const bytes = encoder.encode(signal);
      const hashHex = Array.from(bytes.slice(0, 32))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      feedback = BigInt("0x" + hashHex.padStart(64, "0"));
    } else {
      feedback = BigInt(signal);
    }

    // Create a Group instance with the group data
    // Note: Semaphore V4 Group constructor only takes members array, not groupId/depth
    // Helper function to safely convert member strings to BigInt
    // Handles both hex strings (with/without 0x prefix) and decimal strings
    const convertToBigInt = (value) => {
      if (typeof value === 'bigint') return value;
      if (typeof value === 'number') return BigInt(value);
      
      const str = String(value).trim();
      
      // If it already starts with 0x, use it directly
      if (str.startsWith('0x') || str.startsWith('0X')) {
        return BigInt(str);
      }
      
      // Check if string contains hex characters (a-f, A-F)
      // If it does, it's definitely a hex string (even without 0x prefix)
      const hasHexChars = /[a-fA-F]/.test(str);
      if (hasHexChars) {
        // Hex string without prefix, add 0x
        return BigInt('0x' + str);
      }
      
      // If it's a long string (64 chars = 32 bytes) with only digits,
      // it might be hex or decimal, but try decimal first
      // If decimal conversion fails, try as hex
      if (str.length >= 16 && /^[0-9]+$/.test(str)) {
        try {
          // Try as decimal first
          return BigInt(str);
        } catch (e) {
          // If decimal fails, try as hex
          return BigInt('0x' + str);
        }
      }
      
      // Otherwise treat as decimal
      return BigInt(str);
    };
    
    const members = groupData.members && Array.isArray(groupData.members) && groupData.members.length > 0
      ? groupData.members.map(m => convertToBigInt(m))
      : [];

    console.log("🔍 Creating group with", members.length, "members");
    console.log("🔍 User's commitment:", identity.commitment.toString());

    if (members.length === 0) {
      console.warn("⚠️ No members found in database for group", groupId);
      throw new Error(
        `No members found in the group database. This means:\n` +
        `1. The group might not exist yet\n` +
        `2. The database is empty or not accessible\n` +
        `3. You're using the wrong group ID\n\n` +
        `Group ID: ${groupId}\n` +
        `Please contact support or check that the relayer is running properly.`
      );
    }

    const isUserInGroup = members.some(m => m.toString() === identity.commitment.toString());
    console.log("🔍 Is user in members list?", isUserInGroup);

    if (!isUserInGroup) {
      throw new Error(
        `Your identity commitment is not in the group yet. This might mean:\n` +
        `1. You just joined and the transaction hasn't been confirmed\n` +
        `2. The relayer failed to add you to the group\n` +
        `3. The database is out of sync\n\n` +
        `Your commitment: ${identity.commitment.toString()}\n` +
        `Group members count: ${members.length}\n\n` +
        `Try logging out and logging back in, or wait a few moments and try again.`
      );
    }

    const group = new Group(members);
    console.log("🔍 Group created - root:", group.root.toString(), "depth:", group.depth, "size:", group.size);
    console.log("🔍 Expected on-chain root:", groupData.root);
    console.log("🔍 On-chain group size:", groupData.size);

    // Verify the group root matches (this is critical for proof validation)
    if (group.root.toString() !== groupData.root) {
      console.warn("⚠️ Group root mismatch");
      console.warn("   Local root:", group.root.toString());
      console.warn("   On-chain root:", groupData.root);
      console.warn("   Local group size:", group.size, "On-chain group size:", groupData.size);
      throw new Error(
        `Group data mismatch. The local group reconstruction doesn't match the on-chain state.\n` +
        `This usually means the member list from the database is incomplete or out of sync.`
      );
    }

    // Generate the proof
    console.log("🔍 Generating proof with identity commitment:", identity.commitment.toString());
    const proof = await generateProof(identity, group, feedback, groupId);
    console.log("🔍 Proof object:", proof);

    // Use on-chain root if available (to ensure proof validation passes)
    // This is important when local group might not perfectly match on-chain state
    const merkleTreeRoot = groupData.root || proof.merkleTreeRoot.toString();
    
    if (merkleTreeRoot !== proof.merkleTreeRoot.toString()) {
      console.warn("⚠️ Using on-chain root instead of local proof root");
      console.warn("   Local proof root:", proof.merkleTreeRoot.toString());
      console.warn("   On-chain root:", merkleTreeRoot);
    }

    return {
      merkleTreeDepth: proof.merkleTreeDepth,
      merkleTreeRoot: merkleTreeRoot,
      nullifier: proof.nullifier.toString(),
      feedback: feedback.toString(),
      points: proof.points,
    };
  } catch (error) {
    console.error("Error generating Semaphore proof:", error);
    throw error;
  }
}

/**
 * Fetch group data from Semaphore contract via relayer
 * @param {number} groupId - The group ID
 * @returns {Promise<Object>} Group data including members and merkle tree root
 */
export async function fetchGroupData(groupId) {
  try {
    // Fetch group data via relayer (which uses event logs)
    // This is necessary because Semaphore V4 doesn't have a getMembers() function
    const relayerUrl = import.meta.env.VITE_RELAYER_URL || 'http://localhost:3001';
    const response = await fetch(`${relayerUrl}/api/members/${groupId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to fetch group data');
    }

    const data = await response.json();

    // Use members directly from relayer (which uses MongoDB database as source of truth)
    // Members are stored in chronological order in the database
    const members = data.members || [];

    // Log if user's commitment is missing (for debugging, but don't add it)
    if (typeof window !== "undefined") {
      const storedCommitment = localStorage.getItem("ombuSemaphoreCommitment");
      if (storedCommitment) {
        const commitmentStr = storedCommitment.toString();
        const commitmentHex = "0x" + BigInt(storedCommitment).toString(16).padStart(64, "0");
        const isIncluded = members.includes(commitmentStr) || 
                          members.includes(commitmentHex) ||
                          members.some(m => m.toString() === commitmentStr || m.toString() === commitmentHex);
        
        if (!isIncluded) {
          console.warn("⚠️ User's commitment not found in group members list.");
          console.warn("   User commitment:", storedCommitment);
          console.warn("   Group members:", members);
          console.warn("   This might cause proof generation to fail if the user is not actually a member.");
        }
      }
    }

    return {
      root: data.root,
      depth: data.depth,
      size: data.size,
      members: members,
    };
  } catch (error) {
    console.error("Error fetching group data:", error);
    throw error;
  }
}

