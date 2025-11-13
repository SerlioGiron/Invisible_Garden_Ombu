import React, { useMemo } from "react";
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Stack,
  Badge,
  SimpleGrid,
  Card,
  Avatar,
  Paper,
} from "@mantine/core";
import {
  IconTrendingUp,
  IconUsers,
  IconMessageCircle,
  IconStar,
  IconUser,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { usePrivy } from "@privy-io/react-auth";
import { useGroupPosts } from "../hooks/usePostComments";
import { DEFAULT_GROUP_ID } from "../services/contract";
import UpVote from "../components/UpVote";
import DownVote from "../components/DownVote";
import { usePostVotes } from "../hooks/usePostVotes";

function RecentPostCard({ post, authenticated }) {
  const {
    upvotes,
    downvotes,
    userVote,
    refetchVotes,
    refetchUserVote,
  } = usePostVotes(post.id);

  const effectiveUpvotes =
    typeof upvotes === "number" && !Number.isNaN(upvotes) ? upvotes : post.upvotes || 0;
  const effectiveDownvotes =
    typeof downvotes === "number" && !Number.isNaN(downvotes) ? downvotes : post.downvotes || 0;

  return (
    <Paper key={post.id} p="md" withBorder radius="md">
      <Group justify="space-between" mb="sm">
        <Group>
          <Avatar color="blue" size="sm" radius="xl">
            {post.authorAddress?.substring(2, 4).toUpperCase() || "AN"}
          </Avatar>
          <div>
            <Text size="sm" fw={500} style={{ fontFamily: "monospace" }}>
              {post.commitmentId ?? "Anonymous member"}
            </Text>
            <Text size="xs" c="dimmed">
              {post.timeAgo}
            </Text>
          </div>
        </Group>
        {effectiveUpvotes >= 50 && (
          <Badge color="orange" variant="light" size="sm">
            Trending
          </Badge>
        )}
      </Group>
      {post.title && (
        <Text size="md" fw={600} mb="xs" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {post.title}
        </Text>
      )}
      <Text size="sm" mb="sm" c="dimmed" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {post.content}
      </Text>
      <Group gap="md" align="center">
        <Group gap="xs" align="center">
          <UpVote postId={post.id} groupId={post.groupId} disabled={!authenticated} hasVoted={userVote === 1} onSuccess={() => {
            refetchVotes?.();
            refetchUserVote?.();
          }} />
          <Text size="sm" fw={600}>
            {effectiveUpvotes}
          </Text>
        </Group>
        <Group gap="xs" align="center">
          <DownVote postId={post.id} groupId={post.groupId} disabled={!authenticated} hasVoted={userVote === -1} onSuccess={() => {
            refetchVotes?.();
            refetchUserVote?.();
          }} />
          <Text size="sm" fw={600}>
            {effectiveDownvotes}
          </Text>
        </Group>
      </Group>
    </Paper>
  );
}

function Home() {
  const navigate = useNavigate();
  const { authenticated } = usePrivy();

  // Using useGroupPosts hook to fetch all posts
  const { posts: groupPosts, isLoading, error, totalPosts: groupTotalPosts } = useGroupPosts(DEFAULT_GROUP_ID);

  // Helper function to format timestamp
  function formatTimeAgo(timestamp) {
    if (!timestamp) return "Unknown";
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }

  function getCommitmentIdentifier(authorAddress) {
    if (!authorAddress) return "0x0000000000000000000000000000000000000000";
    const cleanAddress = authorAddress.toLowerCase().replace('0x', '');
    const extended = (cleanAddress + cleanAddress + cleanAddress).substring(0, 64);
    return `0x${extended.substring(0, 16)}...${extended.substring(extended.length - 16)}`;
  }

  // Format recent posts from groupPosts
  const recentPosts = useMemo(() => {
    if (!groupPosts || groupPosts.length === 0) return [];
    return [...groupPosts]
      .sort((a, b) => b.id - a.id)
      .slice(0, 10)
      .map((post, index) => {
        const postId = post.id ?? index + 1;
        const commitmentId = post.author
          ? getCommitmentIdentifier(post.author)
          : null;
        
        return {
          id: postId,
          groupId: post.groupId ?? DEFAULT_GROUP_ID,
          authorAddress: post.author || null,
          title: post.title || "",
          content: post.content || "",
          timestamp: post.timestamp,
          upvotes: Number(post.upvotes) || 0,
          downvotes: Number(post.downvotes) || 0,
          commitmentId: commitmentId,
          timeAgo: formatTimeAgo(post.timestamp),
        };
      });
  }, [groupPosts]);

  // Quick stats
  const totalPosts = groupTotalPosts || 0;
  const trendingPosts = groupPosts?.filter(
    (post) => post.upvotes >= 50 || post.downvotes >= 50
  ).length || 0;
  const activeUsers = groupPosts ? new Set(groupPosts.map((p) => p.author)).size : 0;

  const statsCards = [
    {
      title: "Total Posts",
      value: totalPosts,
      icon: IconMessageCircle,
      color: "blue",
    },
    {
      title: "Trending",
      value: trendingPosts,
      icon: IconTrendingUp,
      color: "orange",
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: IconUsers,
      color: "green",
    },
  ];

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Quick stats */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} padding="md" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      {stat.title}
                    </Text>
                    <Text fw={700} size="xl">
                      {stat.value}
                    </Text>
                  </div>
                  <Icon
                    size={28}
                    color={`var(--mantine-color-${stat.color}-6)`}
                  />
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>

        {/* Recent posts */}
        <div>
          <Group justify="space-between" mb="md">
            <Title size="h3">Recent Posts</Title>
            <Button variant="subtle" onClick={() => navigate("/comunidad")}>
              View all
            </Button>
          </Group>

          {isLoading ? (
            <Paper p="xl" ta="center" c="dimmed">
              <Text>Loading posts...</Text>
            </Paper>
          ) : !recentPosts || recentPosts.length === 0 ? (
            <Paper p="xl" ta="center" c="dimmed">
              <IconMessageCircle
                size={48}
                style={{ opacity: 0.5, marginBottom: "1rem" }}
              />
              <Text>No posts yet</Text>
              <Button
                mt="md"
                onClick={() => navigate("/nueva-publicacion")}
                disabled={!authenticated}
              >
                Create the first post
              </Button>
            </Paper>
          ) : (
            <Stack gap="md">
              {recentPosts.map((post) => (
                <RecentPostCard
                  key={post.id}
                  post={post}
                  authenticated={authenticated}
                />
              ))}
            </Stack>
          )}
        </div>

        {/* Quick links */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Card padding="md" radius="md" withBorder>
            <Group mb="md">
              <IconUser size={24} />
              <Title size="h4">My Profile</Title>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              View your posts, settings and statistics
            </Text>
            <Button
              variant="light"
              fullWidth
              onClick={() => navigate("/perfil")}
              disabled={!authenticated}
            >
              View Profile
            </Button>
          </Card>

          <Card padding="md" radius="md" withBorder>
            <Group mb="md">
              <IconStar size={24} />
              <Title size="h4">Trending</Title>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              Explore the most popular posts in the community
            </Text>
            <Button
              variant="light"
              fullWidth
              onClick={() => navigate("/comunidad")}
              disabled={!authenticated}
            >
              View trending posts
            </Button>
          </Card>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

export default Home;