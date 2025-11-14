import React, { useState } from "react";
import {
  Paper,
  Title,
  Text,
  Avatar,
  Group,
  Stack,
  Badge,
  Button,
  Tooltip,
  Collapse,
  Divider,
  Space,
  Textarea,
  Alert,
} from "@mantine/core";
import {
  IconMessageCircle,
  IconTrendingUp,
  IconChevronDown,
  IconChevronUp,
  IconSend,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useContract } from "../hooks/useContract";
import { usePostVotes } from "../hooks/usePostVotes";
import { usePostComments } from "../hooks/usePostComments";
import { categories } from "../services/contract";
import { validarPostAI } from "../services/apiBackendAI";
import Comment from "./Comment";
import UpVote from "./UpVote";
import DownVote from "./DownVote";

function PostCard({ post, reply = false }) {
  const { userAddress, addComment } = useContract();
  const [showComments, setShowComments] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isValidatingAI, setIsValidatingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Get votes from blockchain
  const {
    upvotes: hookUpvotes,
    downvotes: hookDownvotes,
    userVote,
    refetchVotes,
    refetchUserVote,
    recordVote,
  } = usePostVotes(post.id, post.groupId);

  // Use votes from post data (already fetched from blockchain)
  const upvotes = post.upvotes || 0;
  const downvotes = post.downvotes || 0;

  // Get comments from blockchain
  const {
    count: commentsCount,
    comments,
    refetch: refetchComments,
  } = usePostComments(post.id);

  // Determine if post is trending based on upvotes
  const isTrending = upvotes >= 50;

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !userAddress) return;

    setIsSubmittingReply(true);
    setIsValidatingAI(true);
    setAiSuggestion(null); // Clear previous suggestions

    try {
      // Validate comment with AI
      console.log("Validating comment with AI:", replyContent);
      const validationResponse = await validarPostAI(replyContent);
      
      setIsValidatingAI(false);

      // Check if there's an AI suggestion
      const data = validationResponse.data;
      if (data && data.comentario_formalizado) {
        // The comment is not valid, show suggestion
        setAiSuggestion(data.comentario_formalizado);
        setIsSubmittingReply(false);
        return;
      }

      // If we get here, the comment is valid (comentario_formalizado is null)
      console.log("Comment validated by AI, proceeding to send...");
      
      await addComment(post.id, replyContent);
      setReplyContent("");
      setIsReplying(false);
      setAiSuggestion(null);
      refetchComments(); // Refresh comments after adding a new one
    } catch (error) {
      console.error("Error submitting comment:", error);
      setIsValidatingAI(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const acceptAiSuggestion = () => {
    setReplyContent(aiSuggestion);
    setAiSuggestion(null);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const formatCommentTime = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - parseInt(timestamp.toString());

    if (diff < 60) return "a few seconds ago";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getCategoryBadge = () => {
    const category = categories.find((cat) => cat.value === post.category);
    if (!category || category.value === "all") return null;

    return (
      <Badge color={category.color} variant="light" size="sm">
        {category.label}
      </Badge>
    );
  };

  return (
    <Paper withBorder p="lg" radius="md" style={{ marginBottom: "1rem" }}>
      <Stack gap="sm">
        {/* Post header */}
        <Group justify="space-between" align="flex-start">
          <Group>
            <Avatar color="blue" radius="xl" size="sm">
              {post.authorAddress
                ? post.authorAddress.substring(2, 4).toUpperCase()
                : "U"}
            </Avatar>
            <div>
              <Tooltip label={post.authorAddress}>
                <Text fw={600} size="sm">
                  {post.authorName}
                </Text>
              </Tooltip>
              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  {post.timeAgo}
                </Text>
                {isTrending && (
                  <Badge
                    color="orange"
                    variant="light"
                    size="xs"
                    leftSection={<IconTrendingUp size={12} />}
                  >
                    Trending
                  </Badge>
                )}
              </Group>
            </div>
          </Group>
          {getCategoryBadge()}
        </Group>

        {/* Post content */}
        <div>
          <Title
            order={4}
            size="h5"
            mb="xs"
            style={{ textAlign: "left", textWrap: "wrap" }}
          >
            {post.title}
          </Title>
          <Text size="sm" style={{ textAlign: "left", lineHeight: 1.5 }}>
            {post.content}
          </Text>
          <Space h="xl" />
          {/* Topics si existen */}
          {post.topics && post.topics.length > 0 && (
            <Group gap="xs">
              {post.topics.map((topic, index) => (
                <Badge
                  key={index}
                  color="light-blue"
                  variant="outline"
                  size="xs"
                >
                  {topic}
                </Badge>
              ))}
            </Group>
          )}
        </div>

        {/* Post actions */}
        <Group gap="md" mt="sm">
          {!reply && (
            <Group gap="xs" align="center">
              <UpVote
                postId={post.id}
                groupId={post.groupId}
                disabled={!userAddress}
                hasVoted={userVote === 1}
                recordVote={recordVote}
                onSuccess={() => {
                  refetchVotes?.();
                  refetchUserVote?.();
                }}
              />
              <Text size="xs" fw={600} c="dimmed">
                {upvotes}
              </Text>
            </Group>
          )}

          <DownVote
            postId={post.id}
            groupId={post.groupId}
            disabled={!userAddress}
            hasVoted={userVote === -1}
            recordVote={recordVote}
            onSuccess={() => {
              refetchVotes?.();
              refetchUserVote?.();
            }}
          />
          <Text size="xs" fw={600} c="dimmed">
            {downvotes}
          </Text>
        </Group>
            {!reply && (
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconMessageCircle size={14} />}
                color="light-blue"
                onClick={() => setIsReplying(!isReplying)}
              >
                Reply
              </Button>
            )}

        <Collapse in={isReplying}>
          <Stack gap="xs" mt="sm">
            <Textarea
              placeholder="Write your comment..."
              value={replyContent}
              onChange={(event) => setReplyContent(event.currentTarget.value)}
              minRows={2}
              autosize
              disabled={!userAddress || isSubmittingReply}
            />
            
            {/* AI suggestion */}
            {aiSuggestion && (
              <Alert
                icon={<IconInfoCircle size={16} />}
                title="Improvement Suggestion"
                color="light-blue"
                variant="light"
                radius="lg"
                style={{ boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)" }}
              >
                <Stack style={{ paddingRight: "2.5rem" }}>
                  <Text size="sm" align="left">
                    AI has detected that your comment could be improved.
                    Here's a reformulated version:
                  </Text>
                  <Paper p="sm" bg="gray.0" radius="sm">
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                      {aiSuggestion}
                    </Text>
                  </Paper>
                  <Group gap="sm" justify="center">
                    <Button
                      size="sm"
                      variant="filled"
                      onClick={acceptAiSuggestion}
                      radius="md"
                    >
                      Apply suggestion
                    </Button>
                  </Group>
                </Stack>
              </Alert>
            )}

            <Group justify="flex-end">
              <Button
                size="xs"
                variant="subtle"
                onClick={() => {
                  setIsReplying(false);
                  setAiSuggestion(null);
                  setReplyContent("");
                }}
                disabled={isSubmittingReply}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                onClick={handleReplySubmit}
                leftSection={<IconSend size={14} />}
                loading={isSubmittingReply || isValidatingAI}
                disabled={!replyContent.trim() || !userAddress}
              >
                {isValidatingAI ? "Validating..." : "Send"}
              </Button>
            </Group>
          </Stack>
        </Collapse>

        {/* Comments section */}
        <Collapse in={showComments && commentsCount > 0}>
          <Divider my="sm" />
          <Stack gap="sm">
            <Text size="sm" fw={500} c="dimmed">
              Comments ({commentsCount})
            </Text>

            {comments && comments.length > 0 ? (
              comments.map((comment, index) => (
                comment.authorAddress = "Anonymous User",
                comment.authorName = "Anonymous User",
                <PostCard key={index} post={comment} reply />
              ))
            ) : commentsCount > 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                Comments are loading from the blockchain...
              </Text>
            ) : null}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}

export default PostCard;
