import React from "react";
import {
  Container,
  Title,
  Text,
  Grid,
  Paper,
  Group,
  Button,
  Stack,
  Badge,
  SimpleGrid,
  Card,
  Avatar,
  Divider,
} from "@mantine/core";
import {
  IconTrendingUp,
  IconUsers,
  IconMessageCircle,
  IconStar,
  IconUser,
  IconArrowUp,
  IconArrowDown,
  IconMessage,
  IconPlus,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { useContract } from "../hooks/useContract";
import { usePrivy } from "@privy-io/react-auth";

function Home() {
  const navigate = useNavigate();
  const { posts } = useContract();
  const { authenticated } = usePrivy();

  // Estadísticas rápidas
  const totalPosts = posts.length;
  const trendingPosts = posts.filter(
    (post) => post.upvotes >= 50 || post.downvotes >= 50
  ).length;
  const recentPosts = posts.slice(posts.length - 3, posts.length).reverse();

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
      value: new Set(posts.map((p) => p.authorAddress)).size,
      icon: IconUsers,
      color: "green",
    },
  ];

  return (
    <Container size="xl">
      <Stack gap="xl" style={authenticated ? {} : { justifyContent: "center", minHeight: "calc(100vh - 140px)" }}>
        {/* Hero Section */}
        <Paper
          p="xl"
          radius="md"
          style={{
            color: "white",
            background: "transparent",
            marginTop: authenticated ? "2rem" : 0,
          }}
        >
          <Stack align="center" justify="center" gap="md" h={200}>
            <div style={{ textAlign: "center" }}>
              <Title size="h1" mb="md" align="center">
                Welcome to OMBU! 🚀
              </Title>
              <Text size="lg" align="center">
                The first decentralized zk social network for Invisible Garden members
              </Text>
              <Text size="md" opacity={0.9} align="center">
                Connect & share your honest feedback about the fellowship 
              </Text>
            </div>
            {authenticated ? (
              <Button
                size="lg"
                variant="white"
                leftSection={<IconPlus size={20} />}
                onClick={() => navigate("/nueva-publicacion")}
              >
                Create Post
              </Button>
            ) : (
              <Text size="sm" opacity={0.8} align="center">
                Connect your wallet to get started
              </Text>
            )}
          </Stack>
        </Paper>

        {authenticated && (
          <>
            {/* Estadísticas rápidas */}
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

            {/* Posts recientes */}
            <div>
              <Group justify="space-between" mb="md">
                <Title size="h3">Recent Posts</Title>
                <Button variant="subtle" onClick={() => navigate("/comunidad")}>
                  View all
                </Button>
              </Group>

              {recentPosts.length > 0 ? (
                <Stack gap="md">
                  {recentPosts.map((post) => (
                    <Paper key={post.id} p="md" withBorder radius="md">
                      <Group justify="space-between" mb="sm">
                        <Group>
                          <Avatar color="blue" size="sm" radius="xl">
                            {post.authorAddress?.substring(2, 4).toUpperCase()}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={500}>
                              {post.authorName}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {post.timeAgo}
                            </Text>
                          </div>
                        </Group>
                        {post.upvotes >= 50 && (
                          <Badge color="orange" variant="light" size="sm">
                            Trending
                          </Badge>
                        )}
                      </Group>
                      <Title align="left" size="h5" py="xs">
                        {post.title}
                      </Title>
                      <Text size="sm" lineClamp={2} mb="sm">
                        {post.content}
                      </Text>
                      <Group gap="3">
                        <IconArrowUp color="blue" size={14} />
                        <Text size="xs" c="dimmed">
                           {post.upvotes} •
                        </Text>
                        <IconArrowDown color="red" size={14} />
                        <Text size="xs" c="dimmed">
                          {post.downvotes} • 
                        </Text>
                        <IconMessageCircle color="orange" size={14} />
                        <Text size="xs" c="dimmed">
                          {post.comments || 0}
                        </Text>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              ) : (
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
              )}
            </div>

            {/* Enlaces rápidos */}
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
          </>
        )}
      </Stack>
    </Container>
  );
}

export default Home;
