// src/hooks/useContract.js
import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useEstimateGas,
  usePublicClient,
} from "wagmi";
import {
  CONTRACT_CONFIG,
  CATEGORY_MAPPING,
  REVERSE_CATEGORY_MAPPING,
  DEFAULT_GROUP_ID,
} from "../services/contract";
import { getFallbackData } from "../services/fallbackData";
import { sendFeedbackViaRelayer, voteOnPostViaRelayer } from "../services/relayerApi";
import { 
  getSemaphoreIdentityFromStorage, 
  generateSemaphoreProof, 
  fetchGroupData 
} from "../services/semaphoreProof";

export function useContract() {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const publicClient = usePublicClient();
  const [useFallback, setUseFallback] = useState(false);

  // Note: getAllPosts function doesn't exist in the contract
  // Posts need to be fetched individually or through a different method
  const rawPosts = null;
  const isLoadingPosts = false;
  const refetchPosts = () => {};
  const error = null;

  // Detect rate limiting errors and activate fallback
  useEffect(() => {
    if (
      error?.message?.includes("429") ||
      error?.message?.includes("Too Many Requests")
    ) {
      setUseFallback(true);
      console.warn("Rate limit detected, using fallback data");

      // Try to reconnect after 1 minute
      setTimeout(() => {
        setUseFallback(false);
        refetchPosts();
      }, 60000);
    }
  }, [error, refetchPosts]);

  // Transform posts from blockchain to our UI format
  const transformPost = (post, index) => {
    const timestamp = parseInt(post.timestamp.toString());
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    let timeAgo;
    if (diff < 60) timeAgo = "a few seconds ago";
    else if (diff < 3600) timeAgo = `${Math.floor(diff / 60)} minutes ago`;
    else if (diff < 86400) timeAgo = `${Math.floor(diff / 3600)} hours ago`;
    else timeAgo = `${Math.floor(diff / 86400)} days ago`;

    return {
      id: index,
      title: post.title,
      content: post.content,
      // authorName: `${post.author.substring(0, 6)}...${post.author.substring(38)}`,
      authorName: `User ${post.author.substring(
        0,
        6
      )}...${post.author.substring(38)}`,
      authorAddress: post.author,
      timeAgo,
      category: CATEGORY_MAPPING[post.category] || "opinion",
      topics: post.topics || [],
      upvotes: 0, // Will be obtained separately
      downvotes: 0, // Will be obtained separately
      comments: 0, // Will be obtained separately
      trending: false,
    };
  };

  // Get transformed posts (with fallback)
  const posts = useFallback
    ? getFallbackData()
    : rawPosts
    ? rawPosts.map(transformPost)
    : [];

  // Indicate if we're using fallback data
  const isUsingFallback = useFallback;

  // Function to create a post
  const createPost = async (content, category, topics = []) => {
    try {
      const categoryNumber = REVERSE_CATEGORY_MAPPING[category];

      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: "post",
        args: [content, categoryNumber, topics],
      });

      return true;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  };

  // Function to estimate vote gas
  const estimateVoteGas = async (postId, voteType) => {
    try {
      const functionName = voteType === "up" ? "upvote" : "downvote";

      const gasEstimate = await useEstimateGas({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName,
        args: [postId],
      });

      console.log(
        `Estimated gas for ${voteType}vote:`,
        gasEstimate.data?.toString()
      );
      return gasEstimate.data;
    } catch (error) {
      console.error("Error estimating gas:", error);
      return 100000n; // Conservative fallback
    }
  };

  // Function to vote
  const vote = async (postId, voteType) => {
    try {
      const functionName = voteType === "up" ? "upvote" : "downvote";

      // Optimized gas configuration
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName,
        args: [postId],
        gas: 100000n, // More conservative gas limit
        gasPrice: undefined, // Allow wallet to handle gas price
      });

      return true;
    } catch (error) {
      console.error("Error voting:", error);

      // If it fails due to insufficient gas, retry with more gas
      if (
        error.message?.includes("out of gas") ||
        error.message?.includes("insufficient gas")
      ) {
        console.log("Retrying with more gas...");
        try {
          await writeContract({
            address: CONTRACT_CONFIG.address,
            abi: CONTRACT_CONFIG.abi,
            functionName,
            args: [postId],
            gas: 150000n, // Additional gas for retry
          });
          return true;
        } catch (retryError) {
          console.error("Error on retry:", retryError);
          throw retryError;
        }
      }

      throw error;
    }
  };

  const getStoredIdentityCommitment = () => {
    if (typeof window === "undefined") {
      return null;
    }

    // Always derive commitment from signature (single source of truth)
    const identity = getSemaphoreIdentityFromStorage();
    if (!identity) {
      return null;
    }

    try {
      return BigInt(identity.commitment.toString());
    } catch (error) {
      console.warn("Unable to parse identity commitment:", error);
      return null;
    }
  };

  const normalizeBigInt = (value, name) => {
    if (typeof value === "bigint") {
      return value;
    }
    try {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
          return BigInt(trimmed);
        }
        return BigInt(trimmed);
      }
      if (typeof value === "number") {
        return BigInt(value);
      }
      throw new Error(`Unsupported type ${typeof value}`);
    } catch (error) {
      throw new Error(`Invalid ${name}: ${error.message}`);
    }
  };

  const upvotePost = async (postId, options = {}) => {
    const { groupId = DEFAULT_GROUP_ID, identityCommitment } = options;

    if (postId === undefined || postId === null) {
      throw new Error("postId is required to upvote");
    }

    try {
      const commitment =
        identityCommitment ??
        getStoredIdentityCommitment() ??
        (() => {
          const identity = getSemaphoreIdentityFromStorage();
          return identity ? normalizeBigInt(identity.commitment.toString(), "identity commitment") : null;
        })();

      if (!commitment) {
        throw new Error("Semaphore identity commitment not found. Please join the group first.");
      }

      const normalizedGroupId = normalizeBigInt(groupId, "groupId");
      const normalizedPostId = normalizeBigInt(postId, "postId");

      const result = await voteOnPostViaRelayer({
        groupId: normalizedGroupId.toString(),
        postId: normalizedPostId.toString(),
        identityCommitment: commitment.toString(),
        isUpvote: true,
      });

      return result?.transactionHash || null;
    } catch (error) {
      console.error("Error downvoting post:", error);
      throw error;
    }
  };

  const downvotePost = async (postId, options = {}) => {
    const { groupId = DEFAULT_GROUP_ID, identityCommitment } = options;

    if (postId === undefined || postId === null) {
      throw new Error("postId is required to downvote");
    }

    try {
      const commitment =
        identityCommitment ??
        getStoredIdentityCommitment() ??
        (() => {
          const identity = getSemaphoreIdentityFromStorage();
          return identity ? normalizeBigInt(identity.commitment.toString(), "identity commitment") : null;
        })();

      if (!commitment) {
        throw new Error("Semaphore identity commitment not found. Please join the group first.");
      }

      const normalizedGroupId = normalizeBigInt(groupId, "groupId");
      const normalizedPostId = normalizeBigInt(postId, "postId");

      const result = await voteOnPostViaRelayer({
        groupId: normalizedGroupId.toString(),
        postId: normalizedPostId.toString(),
        identityCommitment: commitment.toString(),
        isUpvote: false,
      });

      return result?.transactionHash || null;
    } catch (error) {
      console.error("Error upvoting post:", error);
      throw error;
    }
  };
    

  // Function to create a post
  const post = async (title, content, category, topics = []) => {
    try {
      const functionName = "post";

      console.log("calling writeContract");
      console.log("args:", [title, content, category, topics]);
      switch (category) {
        case "Complaint":
          category = 0;
          break;
        case "Opinion":
          category = 1;
          break;
        case "Suggestion":
          category = 2;
          break;
        case "University Life":
          category = 3;
          break;
        default:
          // Logic for other categories
          break;
      }
      const response = await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: "post",
        args: [title, content, category, topics],
      });

      console.log(response);

      return true;
    } catch (error) {
      console.error("Error posting:", error);
      throw error;
    }
  };

  // Function to add a comment
  const addComment = async (postId, content) => {
    try {
      console.log("Adding comment to post:", postId, "Content:", content);
      
      const response = await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: "comment",
        args: [postId, content],
      });

      console.log("Comment sent successfully:", response);
      return true;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  // Function to create a main post
  // Automatically generates Semaphore proof if identity exists (anonymous)
  // Otherwise falls back to direct contract call (non-anonymous)
  const createMainPost = async (groupId, title, content, feedback, merkleTreeDepth, merkleTreeRoot, nullifier, points) => {
    try {
      console.log("Creating main post in group:", groupId, "Title:", title, "Content:", content);
      
      // If Semaphore proof parameters are explicitly provided, use them
      if (feedback !== undefined && merkleTreeDepth !== undefined && merkleTreeRoot !== undefined && nullifier !== undefined && points !== undefined) {
        console.log("Using provided Semaphore proof parameters");
        const response = await sendFeedbackViaRelayer({
          title,
          content,
          groupId,
          feedback,
          merkleTreeDepth,
          merkleTreeRoot,
          nullifier,
          points
        });
        console.log("Main post created successfully:", response);
        return response;
      }

      // Try to generate proof automatically if identity exists
      const identity = getSemaphoreIdentityFromStorage();
      if (!identity) {
        console.log("⚠️ No Semaphore identity found. Creating non-anonymous post. To enable anonymous posts, make sure you're logged in and have joined the Semaphore group.");
      }
      
      if (identity && publicClient) {
        try {
          console.log("🔐 Generating Semaphore proof for anonymous post...");

          // Fetch group data from Semaphore contract via relayer
          const groupData = await fetchGroupData(groupId);
          console.log("📊 Group data fetched (raw):", JSON.stringify(groupData, null, 2));
          console.log("📊 Group data members type:", typeof groupData.members);
          console.log("📊 Group data members isArray:", Array.isArray(groupData.members));
          console.log("📊 Group data summary:", {
            depth: groupData.depth,
            size: groupData.size,
            membersCount: groupData.members?.length || 0
          });
          
          // Generate proof using content + timestamp as signal to ensure uniqueness
          // This prevents nullifier reuse when creating multiple posts
          const uniqueSignal = `${content}||${Date.now()}||${Math.random()}`;
          console.log("🔐 Generating unique signal for post:", uniqueSignal.substring(0, 50) + "...");
          const proofData = await generateSemaphoreProof(identity, groupId, uniqueSignal, groupData);
          console.log("✅ Proof generated successfully");
          
          console.log("📤 Sending anonymous post via relayer...");
          const response = await sendFeedbackViaRelayer({
            title,
            content,
            groupId,
            feedback: proofData.feedback,
            merkleTreeDepth: proofData.merkleTreeDepth,
            merkleTreeRoot: proofData.merkleTreeRoot,
            nullifier: proofData.nullifier,
            points: proofData.points,
          });
          
          console.log("✅ Anonymous post created successfully:", response);
          return response;
        } catch (proofError) {
          console.error("❌ Failed to generate Semaphore proof:", proofError);
          console.warn("⚠️ Falling back to non-anonymous post");
          // Fall through to non-anonymous post
        }
      }

      // Fallback to non-anonymous post via direct contract call
      console.log("Using non-anonymous post via direct contract call");
      // Note: Direct contract calls without Semaphore proof are not supported in this version
      // The contract requires Semaphore proof parameters
      throw new Error("Cannot create post without Semaphore identity. Please join the group first.");
    } catch (error) {
      console.error("Error creating main post:", error);
      throw error;
    }
  };

  // Get all posts by an author
  const getPostsByAuthor = (authorAddress) => {
    const {
      data: postIds,
      isLoading: isLoadingPostIds,
      error,
      refetch,
    } = useReadContract({
      address: CONTRACT_CONFIG.address,
      abi: CONTRACT_CONFIG.abi,
      functionName: "getPostsByAuthor",
      args: [authorAddress],
      // Only execute query if author address is provided
      query: {
        enabled: !!authorAddress,
        staleTime: 15000, // 15 seconds
      },
    });

    return {
      postIds: postIds || [], // Returns empty array if undefined
      isLoading: isLoadingPostIds,
      error,
      refetchPostIds: refetch,
    };
  }

  return {
    posts,
    isLoadingPosts: isLoadingPosts && !useFallback,
    refetchPosts,
    createPost,
    vote,
    post,
    addComment,
    createMainPost,
    estimateVoteGas,
    upvotePost,
    downvotePost,
    userAddress,
    isTransactionPending: isPending,
    transactionHash: hash,
    isUsingFallback,
    getPostsByAuthor,
  };
}
