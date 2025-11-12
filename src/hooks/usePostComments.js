// src/hooks/usePostComments.js
import { useState, useEffect } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_CONFIG } from '../services/contract';

const DEFAULT_GROUP_ID = 5;

/**
 * Hook to get all posts from a specific group
 */
export function useGroupPosts(groupId = DEFAULT_GROUP_ID) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const publicClient = usePublicClient();

  // Get the post counter for the group
  const { data: postCounter, refetch: refetchCounter } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'groupPostCounters',
    args: [groupId],
    query: {
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: true,
    }
  });

  useEffect(() => {
    async function fetchPosts() {
      if (!postCounter || !publicClient) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const totalPosts = Number(postCounter);
        console.log(`📊 Fetching ${totalPosts} posts from group ${groupId}...`);

        const postsPromises = [];
        
        // The posts start from ID 1
        for (let i = 1; i <= totalPosts; i++) {
          postsPromises.push(
            publicClient.readContract({
              address: CONTRACT_CONFIG.address,
              abi: CONTRACT_CONFIG.abi,
              functionName: 'groupPosts',
              args: [groupId, i],
            })
          );
        }

        const postsData = await Promise.all(postsPromises);
        
        const formattedPosts = postsData.map((post) => ({
          content: post[0], // content
          timestamp: Number(post[1]), // timestamp
          upvotes: Number(post[2]), // upvotes
          downvotes: Number(post[3]), // downvotes
        }));

        setPosts(formattedPosts);
        console.log(`✅ Loaded ${formattedPosts.length} posts`);
      } catch (err) {
        console.error('❌ Error fetching posts:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPosts();
  }, [postCounter, publicClient, groupId]);

  const refetch = async () => {
    await refetchCounter();
  };

  return {
    posts,
    isLoading,
    error,
    refetch,
    totalPosts: postCounter ? Number(postCounter) : 0,
  };
}

/**
 * Hook to get a specific post with its subposts (comments)
 */
export function usePostWithComments(groupId = DEFAULT_GROUP_ID, postId) {
  const [post, setPost] = useState(null);
  const [subPosts, setSubPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const publicClient = usePublicClient();

  // Get the main post
  const { data: mainPostData, refetch: refetchMainPost } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'groupPosts',
    args: [groupId, postId],
    enabled: postId !== undefined,
    query: {
      staleTime: 30000,
    }
  });

  useEffect(() => {
    async function fetchSubPosts() {
      if (!mainPostData || !publicClient || !postId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Format the main post
        const formattedPost = {
          content: mainPostData[1],
          timestamp: Number(mainPostData[2]),
          upvotes: Number(mainPostData[3]),
          downvotes: Number(mainPostData[4]),
        };
        setPost(formattedPost);

        // Try to get subposts (comments)
        // Since there is no counter, we try until we find an empty post
        const fetchedSubPosts = [];
        let maxAttempts = 100; // Safety limit

        while (subPostId <= maxAttempts) {
          try {
            const subPostData = await publicClient.readContract({
              address: CONTRACT_CONFIG.address,
              abi: CONTRACT_CONFIG.abi,
              functionName: 'postSubPosts',
              args: [groupId, postId, subPostId],
            });

            // If the author is address(0), it means it does not exist
            if (subPostData[0] === '0x0000000000000000000000000000000000000000') {
              break;
            }

            fetchedSubPosts.push({
              content: subPostData[1],
              timestamp: Number(subPostData[2]),
              upvotes: Number(subPostData[3]),
              downvotes: Number(subPostData[4]),
            });

            subPostId++;
          } catch {
            // If there is an error, we assume there are no more subposts
            break;
          }
        }

        setSubPosts(fetchedSubPosts);
        console.log(`✅ Loaded post ${postId} with ${fetchedSubPosts.length} comments`);
      } catch (err) {
        console.error('❌ Error fetching post with comments:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubPosts();
  }, [mainPostData, publicClient, groupId, postId]);

  const refetch = async () => {
    await refetchMainPost();
  };

  return {
    post,
    subPosts,
    isLoading,
    error,
    refetch,
    commentsCount: subPosts.length,
  };
}

// Keep compatibility with the previous name
export function usePostComments(postId, groupId = DEFAULT_GROUP_ID) {
  return usePostWithComments(groupId, postId);
}
