// src/hooks/useContract.js
import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useEstimateGas,
} from "wagmi";
import {
  CONTRACT_CONFIG,
  CATEGORY_MAPPING,
  REVERSE_CATEGORY_MAPPING,
} from "../services/contract";
import { getFallbackData } from "../services/fallbackData";

export function useContract() {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const [useFallback, setUseFallback] = useState(false);

  // Function to get all posts
  const {
    data: rawPosts,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
    error,
  } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: "getAllPosts",
    query: {
      staleTime: 10000, // 10 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: 30000, // Auto refetch every 30 seconds
    },
  });

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
    estimateVoteGas,
    userAddress,
    isTransactionPending: isPending,
    transactionHash: hash,
    isUsingFallback,
    getPostsByAuthor,
  };
}
