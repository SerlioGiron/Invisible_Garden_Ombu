// src/hooks/usePostComments.js
import { useState, useEffect } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_CONFIG, DEFAULT_GROUP_ID } from '../services/contract';

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
        
        const formattedPosts = postsData.map((post, index) => {
          const formattedPost = {
            id: index + 1, // Post IDs start from 1
            groupId: groupId,
            title: post[0], // title
            content: post[1], // content
            timestamp: Number(post[2]), // timestamp
            upvotes: Number(post[3]), // upvotes
            downvotes: Number(post[4]), // downvotes
          };
          console.log(`📊 Post ${index + 1} data:`, {
            title: formattedPost.title,
            upvotes: formattedPost.upvotes,
            downvotes: formattedPost.downvotes,
            rawPost: post
          });
          return formattedPost;
        });

        setPosts(formattedPosts);
        console.log(`✅ Loaded ${formattedPosts.length} posts with votes:`, formattedPosts.map(p => ({ id: p.id, upvotes: p.upvotes, downvotes: p.downvotes })));
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
          id: postId,
          groupId: groupId,
          title: mainPostData[0],
          content: mainPostData[1],
          timestamp: Number(mainPostData[2]),
          upvotes: Number(mainPostData[3]),
          downvotes: Number(mainPostData[4]),
        };
        setPost(formattedPost);

        // Try to get subposts (comments)
        // Since there is no counter, we try until we find an empty post
        const fetchedSubPosts = [];
        let subPostId = 1; // Start from 1
        let maxAttempts = 100; // Safety limit

        while (subPostId <= maxAttempts) {
          try {
            const subPostData = await publicClient.readContract({
              address: CONTRACT_CONFIG.address,
              abi: CONTRACT_CONFIG.abi,
              functionName: 'postSubPosts',
              args: [groupId, postId, subPostId],
            });

            // Check if timestamp is 0, which means the post doesn't exist
            if (Number(subPostData[2]) === 0) {
              break;
            }

            fetchedSubPosts.push({
              id: subPostId,
              groupId: groupId,
              title: subPostData[0],
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
