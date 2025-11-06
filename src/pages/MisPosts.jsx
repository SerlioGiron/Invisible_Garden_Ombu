import React, { useState } from "react";
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Center,
  Loader,
  Paper,
  Select,
  TagsInput,
} from "@mantine/core";
import { IconPlus, IconFilter, IconSearch } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { useContract } from "../hooks/useContract";
import PostCard from "../components/PostCard";
import { categories } from "../services/contract";

function MisPosts() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTags, setSearchTags] = useState([]);

  const { posts: allPosts, isLoadingPosts, userAddress, getPostsByAuthor } = useContract();
  const { postIds, isLoading: isLoadingIds } = getPostsByAuthor(userAddress);

  // Filtering logic to include category and tags
  const userPosts = (allPosts || [])
    .filter((post) => // First, filter by author
      (postIds || []).map((id) => parseInt(id.toString())).includes(post.id)
    )
    .filter((post) => { // Then, by category
      return selectedCategory === "all" || post.category === selectedCategory;
    })
    .filter((post) => { // Finally, by tags
      if (searchTags.length === 0) {
        return true;
      }
      return post.topics && post.topics.some((tag) => searchTags.includes(tag));
    })
    .sort((a, b) => b.id - a.id); // Sort by most recent

  const handleNewPost = () => {
    navigate("/nueva-publicacion");
  };

  if (isLoadingPosts || isLoadingIds) {
    return (
      <Container size="md">
        <Center style={{ height: "50vh" }}>
          <Stack align="center">
            <Loader size="lg" />
            <Text c="dimmed">Loading your posts...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Title order={1} size="h2">
            My Posts
          </Title>
        </Group>
        <Text align="left" c="dimmed" size="sm">
          Here you can view, filter and search all the posts you have created on the
          blockchain.
        </Text>

        {/* Filter and search controls */}
        <Group grow>
          <TagsInput
            placeholder="Search by topics..."
            value={searchTags}
            onChange={setSearchTags}
            leftSection={<IconSearch size={16} />}
            clearable
          />
          <Select
            placeholder="Filter by category"
            data={categories}
            value={selectedCategory}
            onChange={setSelectedCategory}
            leftSection={<IconFilter size={16} />}
            clearable={false}
          />
        </Group>

        <div>
          {userPosts.length === 0 ? (
            <Paper p="xl" radius="md" style={{ textAlign: "center" }}>
              <Text c="dimmed" mb="md">
                No posts found with the current filters.
              </Text>
              <Button
                variant="light"
                onClick={handleNewPost}
                leftSection={<IconPlus size={16} />}
              >
                Create your first post
              </Button>
            </Paper>
          ) : (
            userPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </Stack>
    </Container>
  );
}

export default MisPosts;