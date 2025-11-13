import express from "express";
import {
  validateABI,
  getContract,
  handleError,
  checkBalance,
} from "../utils/contract.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { groupId, postId, identityCommitment, isUpvote = true } = req.body ?? {};

    if (
      groupId === undefined ||
      postId === undefined ||
      identityCommitment === undefined
    ) {
      return res.status(400).json({
        error: "Missing required parameter",
        details: "groupId, postId, and identityCommitment are required",
      });
    }

    if (!validateABI(res)) {
      return;
    }

    const { provider, signer, contract } = getContract();

    if (!(await checkBalance(provider, signer, res))) {
      return;
    }

    const normalizedGroupId = BigInt(groupId);
    const normalizedPostId = BigInt(postId);
    const normalizedCommitment = BigInt(identityCommitment);
    const voteDirection = Boolean(isUpvote);

    console.log("   Relayer vote request:");
    console.log("     Group ID:", normalizedGroupId.toString());
    console.log("     Post ID:", normalizedPostId.toString());
    console.log("     Identity commitment:", normalizedCommitment.toString());
    console.log("     Direction:", voteDirection ? "upvote" : "downvote");

    const isMember = await contract.isGroupMember(
      normalizedGroupId,
      normalizedCommitment
    );

    if (!isMember) {
      return res.status(403).json({
        error: "Not a group member",
        details:
          "The provided identity commitment does not belong to the specified group",
      });
    }

    const tx = await contract.voteOnPost(
      normalizedGroupId,
      normalizedPostId,
      voteDirection,
      normalizedCommitment
    );

    console.log("   Transaction sent:", tx.hash);
    const receipt = await tx.wait();

    console.log("✅ Vote confirmed in block:", receipt.blockNumber);

    return res.status(200).json({
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString(),
    });
  } catch (error) {
    console.error("❌ Error in vote route:", error);
    return handleError(error, res);
  }
});

export default router;