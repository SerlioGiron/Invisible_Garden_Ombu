import React from 'react';
import {
  Container,
  Paper,
  Avatar,
  Text,
  Group,
  Stack,
  Badge,
  Grid,
  Card,
  Title,
  Divider,
  SimpleGrid,
  RingProgress,
  Center,
  Loader,
  Tabs,
} from '@mantine/core';
import {
  IconUser,
  IconTrophy,
  IconCoin,
  IconCalendar,
  IconMessage,
  IconList,
} from '@tabler/icons-react';
import { useContract } from '../hooks/useContract';
import PostCard from '../components/PostCard';

function Perfil() {
  // Get user data and their posts from the blockchain
  const {
    userAddress,
    posts: allPosts,
    isLoadingPosts,
    getPostsByAuthor
  } = useContract();
  const { postIds, isLoading: isLoadingIds } = getPostsByAuthor(userAddress);

  // Filter posts that belong to the current user
  const userPosts = (allPosts || [])
    .filter((post) =>
      (postIds || []).map((id) => parseInt(id.toString())).includes(post.id)
    )
    .sort((a, b) => b.id - a.id);

  // Statistics based on blockchain data (examples)
  const userStats = {
    posts: userPosts.length,
    reputation: 850, // This value could come from the contract in the future
    joinDate: 'August 2025', // This value could come from the contract in the future
  };

  if (isLoadingPosts || isLoadingIds) {
    return (
      <Container size="md">
        <Center style={{ height: '50vh' }}>
          <Stack align="center">
            <Loader size="lg" />
            <Text c="dimmed">Loading profile from blockchain...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Anonymous Profile Header */}
        <Paper withBorder p="xl" radius="md">
          <Grid align="center">
            <Grid.Col span={{ base: 12, md: "auto" }}>
              <Avatar size={100} radius="xl" color="blue">
                <IconUser size={50} />
              </Avatar>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="xs">
                <Title order={2} size="h3" align="left">
                  {userAddress
                    ? `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`
                    : 'Anonymous User'}
                </Title>
                <Group gap="md">
                  <Badge color="gray" variant="light" size="sm">
                    Wallet Address
                  </Badge>
                  <Group gap="xs">
                    <IconCalendar size={16} color="var(--mantine-color-gray-6)" />
                    <Text size="sm" c="dimmed">Member since {userStats.joinDate}</Text>
                  </Group>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Statistics */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Card withBorder p="md" radius="md">
            <Stack align="center" gap="xs" py="md">
              <Text fw={700} size="xl" c="blue">{userStats.posts}</Text>
              <Text size="sm" c="dimmed">Posts</Text>
            </Stack>
          </Card>
          <Card withBorder p="md" radius="md">
            <Stack align="center" gap="xs">
              <RingProgress
                size={50}
                thickness={6}
                sections={[{ value: (userStats.reputation / 1000) * 100, color: 'gold' }]}
                label={
                  <Center>
                    <IconCoin size={14} />
                  </Center>
                }
              />
              <Text size="sm" c="dimmed" ta="center">Reputation<br/>{userStats.reputation}/1000</Text>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" variant="outline">
          <Tabs.List>
            <Tabs.Tab value="posts" leftSection={<IconList size={16} />}>
              My Posts ({userPosts.length})
            </Tabs.Tab>
            {/* <Tabs.Tab value="achievements" leftSection={<IconTrophy size={16} />}>
              Achievements
            </Tabs.Tab> */}
          </Tabs.List>

          <Tabs.Panel value="posts" pt="md">
            <Stack>
              {userPosts.length > 0 ? (
                userPosts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
                  <Text c="dimmed">You haven't made any posts yet.</Text>
                </Paper>
              )}
            </Stack>
          </Tabs.Panel>

          {/* <Tabs.Panel value="achievements" pt="md">
            <Paper withBorder p="md" radius="md">
              <Stack align="center" gap="md">
                <IconTrophy size={40} color="var(--mantine-color-gray-5)" />
                <Text c="dimmed">The achievements section will be available soon.</Text>
              </Stack>
            </Paper>
          </Tabs.Panel> */}
        </Tabs>
      </Stack>
    </Container>
  );
}

export default Perfil;