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
    const members = groupData.members && Array.isArray(groupData.members) && groupData.members.length > 0
      ? groupData.members.map(m => BigInt(m))
      : [];

    console.log("🔍 Creating group with members:", members);
    const group = new Group(members);
    console.log("🔍 Group created - root:", group.root.toString(), "depth:", group.depth, "size:", group.size);
    console.log("🔍 Expected on-chain root:", groupData.root);
    console.log("🔍 On-chain group size:", groupData.size);

    // Verify the group root matches (this is critical for proof validation)
    if (group.root.toString() !== groupData.root) {
      console.error("❌ Group root mismatch!");
      console.error("   Local root:", group.root.toString());
      console.error("   On-chain root:", groupData.root);
      console.error("   This means not all members were found. The proof will fail on-chain validation.");
      throw new Error(`Group root mismatch: local group has ${group.size} members but on-chain group has ${groupData.size} members. Cannot generate valid proof without all group members.`);
    }

    // Generate the proof
    console.log("🔍 Generating proof with identity commitment:", identity.commitment.toString());
    const proof = await generateProof(identity, group, feedback, groupId);
    console.log("🔍 Proof object:", proof);

    return {
      merkleTreeDepth: proof.merkleTreeDepth,
      merkleTreeRoot: proof.merkleTreeRoot.toString(),
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

    // If no members were found via events, try to reconstruct from current user's identity
    let members = data.members || [];

    // Check if current user's commitment should be in the group
    if (typeof window !== "undefined") {
      const storedCommitment = localStorage.getItem("ombuSemaphoreCommitment");
      if (storedCommitment && members.length === 0) {
        console.warn("⚠️ No members found in events, but user has a commitment. Adding user's commitment to local group.");
        console.warn("   This might indicate the user was added outside the event scanning window.");
        members = [storedCommitment];
      } else if (storedCommitment && !members.includes(storedCommitment) && !members.includes("0x" + BigInt(storedCommitment).toString(16).padStart(64, "0"))) {
        console.warn("⚠️ User's commitment not found in scanned events. Adding it to local group.");
        members.push(storedCommitment);
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

