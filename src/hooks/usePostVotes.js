// src/hooks/usePostVotes.js
import { useReadContract, useAccount } from "wagmi";
import { CONTRACT_CONFIG } from "../services/contract";

export function usePostVotes(postId) {
  const { address: userAddress } = useAccount();

  const {
    data: votes,
    refetch: refetchVotes,
  } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: "getVotes",
    args: [postId],
    enabled: postId !== undefined,
    query: {
      staleTime: 30000, // 30 segundos
      cacheTime: 300000, // 5 minutos
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });

  const {
    data: userVote,
    refetch: refetchUserVote,
  } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: "myVote",
    args: [postId],
    enabled: postId !== undefined && !!userAddress,
    query: {
      staleTime: 30000, // 30 segundos
      cacheTime: 300000, // 5 minutos
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });

  return {
    upvotes: votes ? parseInt(votes[0].toString()) : 0,
    downvotes: votes ? parseInt(votes[1].toString()) : 0,
    userVote: userVote ? parseInt(userVote.toString()) : 0,
    refetchVotes,
    refetchUserVote,
  };
}
