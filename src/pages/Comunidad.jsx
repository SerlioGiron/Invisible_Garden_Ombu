import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Avatar,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Button,
  Divider,
  Tabs,
  Select,
  Center,
  Loader,
  Alert,
  TagsInput,
} from "@mantine/core";
import {
  IconArrowUp,
  IconArrowDown,
  IconMessageCircle,
  IconPlus,
  IconFilter,
  IconTrendingUp,
  IconAlertCircle,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";
import PostCard from "../components/PostCard";
import { categories } from "../services/contract";
import { useContract } from "../hooks/useContract";
import CreateIdentity from "../components/CreateIdentity";

function Comunidad() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("recent");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTags, setSearchTags] = useState([]);

  // Use the contract hook
  const { posts, isLoadingPosts, refetchPosts, userAddress, isUsingFallback } =
    useContract();

  // Filtering and sorting logic
  const displayedPosts = posts
    .filter((post) => {
      // Filter by category
      return selectedCategory === "all" || post.category === selectedCategory;
    })
    .filter((post) => {
      // Filter by search tags
      if (searchTags.length === 0) {
        return true; // If no search tags, show all
      }
      // Check if any of the post's tags are in the search tags
      return post.topics && post.topics.some((tag) => searchTags.includes(tag));
    })
    .filter((post) => {
      // Filter for the "trending" tab
      if (activeTab === "trending") {
        return post.upvotes > 50;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort according to the active tab
      if (activeTab === "trending") {
        return b.upvotes - a.upvotes; // Sort by most upvotes
      }
      return b.id - a.id; // Sort by most recent
    });

  const handleNewPost = () => {
    navigate("/nueva-publicacion");
  };

  if (isLoadingPosts) {
    return (
      <Container size="md">
        <Center style={{ height: "50vh" }}>
          <Stack align="center">
            <Loader size="lg" />
            <Text c="dimmed">Loading posts from blockchain...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  const handleIdentityCreated = (identity) => {
    console.log("Identity successfully created in Comunidad:", identity);
  };

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Group>
            <Title size="h2">University Community</Title>
            <CreateIdentity onIdentityCreated={handleIdentityCreated} />
          </Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleNewPost}
            size="sm"
            disabled={!userAddress}
            radius="md"
          >
            New Post
          </Button>
        </Group>
        <Text c="dimmed" size="sm" align="left">
          Share, discuss and connect with other students on the blockchain
        </Text>

        <Divider />

        {/* Filters and Tabs */}
        <Group justify="space-between">
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="recent">Recent</Tabs.Tab>
              <Tabs.Tab
                value="trending"
                leftSection={<IconTrendingUp size={14} />}
              >
                Trending
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Group align="space-between" w="100%">
            <TagsInput
              placeholder="Search by topic..."
              value={searchTags}
              onChange={setSearchTags}
              leftSection={<IconSearch size={16} />}
              clearable
              flex={1}
            />
            <Select
              placeholder="Filter by category"
              data={categories}
              value={selectedCategory}
              onChange={setSelectedCategory}
              leftSection={<IconFilter size={16} />}
              clearable={false}
              w={220}
            />
          </Group>
        </Group>

        {/* Posts Feed */}
        <div>
          {displayedPosts.length === 0 ? (
            <Paper p="xl" radius="md" style={{ textAlign: "center" }}>
              <Text c="dimmed">
                No posts found with the current filters.
              </Text>
            </Paper>
          ) : (
            displayedPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </Stack>
    </Container>
  );
}

export default Comunidad;