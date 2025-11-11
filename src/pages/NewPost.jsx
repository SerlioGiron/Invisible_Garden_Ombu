import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Avatar,
  Badge,
  ActionIcon,
  Alert,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconSend,
  IconUser,
  IconAlertCircle,
  IconInfoCircle,
  IconCheck,
} from "@tabler/icons-react";
import { useContract } from "../hooks/useContract";
import { useNavigate } from "react-router";
import { categories, DEFAULT_GROUP_ID } from "../services/contract";
import { validarPostAI, validarTituloAI } from "../services/apiBackendAI";
import { useWaitForTransactionReceipt } from "wagmi";

const MAX_TITULO = 50;
const MAX_CONTENIDO = 280;

function NewPost() {
  const { createMainPost, transactionHash, isTransactionPending } = useContract();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingAI, setIsValidatingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiSuggestionTitle, setAiSuggestionTitle] = useState(null);

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: transactionHash,
    });

  useEffect(() => {
      if (isConfirmed) {
        // Success notification
        setTimeout(() => {
          <Alert
            icon={<IconCheck size={16} />}
            title="Post created successfully"
            color="green"
          >
            Your post has been confirmed on the blockchain
          </Alert>;
        }, 3000);
        navigate("/");
      }
    }, [isConfirmed, navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title cannot exceed 100 characters";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.length < 10) {
      newErrors.content = "Content must be at least 10 characters";
    } else if (formData.content.length > 2000) {
      newErrors.content = "Content cannot exceed 2000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form with data:", formData);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setIsValidatingAI(true);
    setAiSuggestion(null); // Clear previous suggestions

    try {
      console.log("Post data:", formData.content);
      const validationResponse = await validarPostAI(formData.content);
      const validationResponseTitle = await validarTituloAI(formData.title);

      setIsValidatingAI(false);

      // Check if there's an AI suggestion
      const data = validationResponse.data;
      if (data && data.comentario_formalizado) {
        // The comment is not valid, show suggestion
        setAiSuggestion(validationResponse.data.comentario_formalizado);
        setIsSubmitting(false);
        return;
      }

      // If we get here, the comment is valid (comentario_formalizado is null)
      console.log("Comment validated by AI, proceeding to publish...");
      const categoria = data.categoria;
      const tags = data.tags || [];

      const dataTitulo = validationResponseTitle.data;
      if (dataTitulo && dataTitulo.titulo_sugerido) {
        // The title is not valid, show suggestion
        setAiSuggestionTitle(dataTitulo.titulo_sugerido);
        setIsSubmitting(false);
        return;
      }

      // Call createMainPost with groupId and content
      // Note: We're only sending content, not title or other fields
      // If you want to include title in content, you can concatenate them
      const fullContent = `${formData.title}\n\n${formData.content}`;
      await createMainPost(DEFAULT_GROUP_ID, fullContent);
    } catch (error) {
      console.error("Error creating post:", error);
      setIsValidatingAI(false);
      setErrors({
        submit:
          "The comment is not coherent or doesn't have enough valid content. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to accept AI suggestion
  const acceptAiSuggestion = (field) => {
    if (field === "title") {
      setFormData((prev) => ({
        ...prev,
        title: aiSuggestionTitle,
      }));
      setAiSuggestionTitle(null);
    } else if (field === "content") {
      setFormData((prev) => ({
        ...prev,
        content: aiSuggestion,
      }));
      setAiSuggestion(null);
    }
  };

  // Function to reject AI suggestion
  const rejectAiSuggestion = () => {
    setAiSuggestion(null);
  };

  const getCategoryBadge = () => {
    if (!formData.category) return null;

    const category = categories.find((cat) => cat.value === formData.category);
    return (
      <Badge color={category.color} variant="light" size="sm">
        {category.label}
      </Badge>
    );
  };

  return (
    <Container size="xl">
      <form size="xl" onSubmit={handleSubmit}>
        <Stack gap="xl">
          <Container w="100%">
            {/* Header with back button */}
            <Group mb="xl">
              <ActionIcon
                variant="subtle"
                onClick={() => navigate("/")}
                aria-label="Go back"
                disabled={isValidatingAI}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Title order={1} size="h2">
                Create New Post
              </Title>
            </Group>

            <Stack gap="lg">
              {/* Author preview */}
              <Paper withBorder p="md" radius="md">
                <Group>
                  <Avatar color="blue" radius="xl">
                    <IconUser size={20} />
                  </Avatar>
                  <div>
                    <Text fw={600} size="sm">
                      Anonymous User
                    </Text>
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        Posting now
                      </Text>
                    </Group>
                  </div>
                </Group>
              </Paper>

              {/* Form */}
              <Paper withBorder p="xl" radius="md">
                <Stack gap="md">
                  {/* Title */}
                  <TextInput
                    label="Post Title"
                    placeholder="Write a title..."
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    error={errors.title}
                    required
                    description={`${formData.title.length}/${MAX_TITULO} characters`}
                    maxLength={MAX_TITULO}
                    disabled={isValidatingAI}
                  />

                  {/* Content */}
                  <Textarea
                    label="Post Content"
                    placeholder="What do you want to share with the community?"
                    value={formData.content}
                    onChange={(e) =>
                      handleInputChange("content", e.target.value)
                    }
                    error={errors.content}
                    required
                    minRows={6}
                    maxRows={12}
                    autosize
                    description={`${formData.content.length}/${MAX_CONTENIDO} characters`}
                    maxLength={MAX_CONTENIDO}
                    disabled={isValidatingAI}
                  />
                </Stack>
              </Paper>

              {/* AI suggestion alert */}
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
                        onClick={() => acceptAiSuggestion("content")}
                        radius="md"
                      >
                        Apply suggestion
                      </Button>
                    </Group>
                  </Stack>
                </Alert>
              )}
              {/* AI suggestion alert */}
              {aiSuggestionTitle && (
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
                      AI has detected that your title could be improved. Here
                      is a reformulated version:
                    </Text>
                    <Paper p="sm" bg="gray.0" radius="sm">
                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                        {aiSuggestionTitle}
                      </Text>
                    </Paper>
                    <Group gap="sm" justify="center">
                      <Button
                        size="sm"
                        variant="filled"
                        onClick={() => acceptAiSuggestion("title")}
                        radius="md"
                      >
                        Apply suggestion
                      </Button>
                    </Group>
                  </Stack>
                </Alert>
              )}

              {/* Submit error */}
              {errors.submit && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Error"
                  color="red"
                  variant="light"
                >
                  {errors.submit}
                </Alert>
              )}

              {/* Action buttons */}
              <Group justify="space-between">
                <Button
                  variant="subtle"
                  onClick={() => navigate("/")}
                  disabled={isSubmitting || isValidatingAI}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  leftSection={<IconSend size={16} />}
                  loading={isSubmitting}
                  disabled={
                    !formData.title || !formData.content || isValidatingAI
                  }
                >
                  {isValidatingAI
                    ? "Validating..."
                    : isSubmitting
                    ? "Publishing..."
                    : "Publish Post"}
                </Button>
              </Group>

              {isValidatingAI && (
                <>
                  <Text italic c="dimmed">
                    Analyzing your post with AI...
                  </Text>
                </>
              )}
            </Stack>
          </Container>
        </Stack>
      </form>
    </Container>
  );
}

export default NewPost;
