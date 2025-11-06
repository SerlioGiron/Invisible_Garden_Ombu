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
  TagsInput, // 1. Importar TagsInput
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
  IconSearch, // 2. Importar el ícono de búsqueda
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
  const [searchTags, setSearchTags] = useState([]); // 3. Añadir estado para los tags de búsqueda

  // Usar el hook del contrato
  const { posts, isLoadingPosts, refetchPosts, userAddress, isUsingFallback } =
    useContract();

  // Lógica de filtrado y ordenamiento en cadena
  const displayedPosts = posts
    .filter((post) => {
      // 4.1: Filtrar por categoría
      return selectedCategory === "all" || post.category === selectedCategory;
    })
    .filter((post) => {
      // 4.2: Filtrar por tags de búsqueda
      if (searchTags.length === 0) {
        return true; // Si no hay tags de búsqueda, mostrar todos
      }
      // Comprobar si alguno de los tags del post está en los tags de búsqueda
      return post.topics && post.topics.some((tag) => searchTags.includes(tag));
    })
    .filter((post) => {
      // 4.3: Filtrar para la pestaña "trending"
      if (activeTab === "trending") {
        return post.upvotes > 50;
      }
      return true;
    })
    .sort((a, b) => {
      // 4.4: Ordenar según la pestaña activa
      if (activeTab === "trending") {
        return b.upvotes - a.upvotes; // Ordenar por más upvotes
      }
      return b.id - a.id; // Ordenar por más reciente
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
            <Text c="dimmed">Cargando posts del blockchain...</Text>
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
        {/* ...código existente de Alerta y Header... */}
        <Group justify="space-between" align="center">
          <Group>
            <Title size="h2">Comunidad Universitaria</Title>
            <CreateIdentity onIdentityCreated={handleIdentityCreated} />
          </Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleNewPost}
            size="sm"
            disabled={!userAddress}
            radius="md"
          >
            Nueva publicación
          </Button>
        </Group>
        <Text c="dimmed" size="sm" align="left">
          Comparte, discute y conecta con otros estudiantes en el blockchain
        </Text>

        <Divider />

        {/* Filtros y Tabs */}
        <Group justify="space-between">
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="recent">Recientes</Tabs.Tab>
              <Tabs.Tab
                value="trending"
                leftSection={<IconTrendingUp size={14} />}
              >
                Trending
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>

          {/* 5. Añadir el componente TagsInput y agruparlo con el Select */}
          <Group align="space-between" w="100%">
            <TagsInput
              placeholder="Buscar por tema..."
              value={searchTags}
              onChange={setSearchTags}
              leftSection={<IconSearch size={16} />}
              clearable
              flex={1}
              // w={250}x
            />
            <Select
              placeholder="Filtrar por categoría"
              data={categories}
              value={selectedCategory}
              onChange={setSelectedCategory}
              leftSection={<IconFilter size={16} />}
              clearable={false}
              w={220}
            />
          </Group>
        </Group>

        {/* Feed de posts */}
        <div>
          {displayedPosts.length === 0 ? (
            <Paper p="xl" radius="md" style={{ textAlign: "center" }}>
              <Text c="dimmed">
                No se encontraron posts con los filtros actuales.
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