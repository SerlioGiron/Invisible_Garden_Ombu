// src/hooks/usePostComments.js
import { useState, useEffect } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_CONFIG } from '../services/contract';

const DEFAULT_GROUP_ID = 5;

/**
 * Hook para obtener todos los posts de un grupo específico
 */
export function useGroupPosts(groupId = DEFAULT_GROUP_ID) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const publicClient = usePublicClient();

  // Obtener el contador de posts del grupo
  const { data: postCounter, refetch: refetchCounter } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'groupPostCounters',
    args: [groupId],
    query: {
      staleTime: 30000, // 30 segundos
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
        
        // Los posts empiezan desde ID 1
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
        
        const formattedPosts = postsData.map((post, index) => ({
          id: index + 1,
          author: post[0], // author
          content: post[1], // content
          timestamp: Number(post[2]), // timestamp
          upvotes: Number(post[3]), // upvotes
          downvotes: Number(post[4]), // downvotes
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
 * Hook para obtener un post específico con sus subposts (comentarios)
 */
export function usePostWithComments(groupId = DEFAULT_GROUP_ID, postId) {
  const [post, setPost] = useState(null);
  const [subPosts, setSubPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const publicClient = usePublicClient();

  // Obtener el post principal
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

        // Formatear el post principal
        const formattedPost = {
          id: postId,
          author: mainPostData[0],
          content: mainPostData[1],
          timestamp: Number(mainPostData[2]),
          upvotes: Number(mainPostData[3]),
          downvotes: Number(mainPostData[4]),
        };
        setPost(formattedPost);

        // Intentar obtener subposts (comentarios)
        // Como no hay contador, intentamos hasta encontrar un post vacío
        const fetchedSubPosts = [];
        let subPostId = 1;
        let maxAttempts = 100; // Límite de seguridad

        while (subPostId <= maxAttempts) {
          try {
            const subPostData = await publicClient.readContract({
              address: CONTRACT_CONFIG.address,
              abi: CONTRACT_CONFIG.abi,
              functionName: 'postSubPosts',
              args: [groupId, postId, subPostId],
            });

            // Si el autor es address(0), significa que no existe
            if (subPostData[0] === '0x0000000000000000000000000000000000000000') {
              break;
            }

            fetchedSubPosts.push({
              id: subPostId,
              author: subPostData[0],
              content: subPostData[1],
              timestamp: Number(subPostData[2]),
              upvotes: Number(subPostData[3]),
              downvotes: Number(subPostData[4]),
            });

            subPostId++;
          } catch {
            // Si hay error, asumimos que no hay más subposts
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

// Mantener compatibilidad con el nombre anterior
export function usePostComments(postId, groupId = DEFAULT_GROUP_ID) {
  return usePostWithComments(groupId, postId);
}
