// src/hooks/usePostVotes.js
import { useReadContract } from "wagmi";
import { CONTRACT_CONFIG, DEFAULT_GROUP_ID } from "../services/contract";
import { getSemaphoreIdentityFromStorage } from "../services/semaphoreProof";
import { useState, useEffect } from "react";

export function usePostVotes(postId, groupId = DEFAULT_GROUP_ID) {
  const [identityCommitment, setIdentityCommitment] = useState(null);
  const [voteType, setVoteType] = useState(0); // 0 = no vote, 1 = upvote, -1 = downvote

  // Get identity commitment from storage
  useEffect(() => {
    const identity = getSemaphoreIdentityFromStorage();
    if (identity) {
      setIdentityCommitment(BigInt(identity.commitment.toString()));
    }
  }, []);

  // Load vote type from localStorage
  useEffect(() => {
    if (postId && identityCommitment) {
      const key = `vote_${groupId}_${postId}_${identityCommitment.toString()}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setVoteType(parseInt(stored));
      }
    }
  }, [postId, groupId, identityCommitment]);

  // Query if user has voted using identity commitment
  const {
    data: hasVoted,
    refetch: refetchUserVote,
  } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: "userPostVotes",
    args: identityCommitment ? [identityCommitment, groupId, postId] : undefined,
    enabled: postId !== undefined && identityCommitment !== null,
    query: {
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  // Store vote type when user votes
  const recordVote = (type) => {
    if (postId && identityCommitment) {
      const key = `vote_${groupId}_${postId}_${identityCommitment.toString()}`;
      localStorage.setItem(key, type.toString());
      setVoteType(type);
    }
  };

  return {
    upvotes: 0, // These will come from post data
    downvotes: 0, // These will come from post data
    userVote: hasVoted ? voteType : 0,
    hasVoted: Boolean(hasVoted),
    refetchVotes: () => {}, // Not needed, votes come from post data
    refetchUserVote,
    recordVote, // New function to record vote type
  };
}
