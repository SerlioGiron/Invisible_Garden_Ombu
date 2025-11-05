import React from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Button
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router";

function Welcome() {
  const { authenticated } = usePrivy();
  const navigate = useNavigate();

  return (
    <Container size="xl">
      <Stack gap="xl" style={{ justifyContent: "center", minHeight: "calc(100vh - 140px)" }}>
        <Paper
          p="xl"
          radius="md"
          style={{
            color: "white",
            background: "transparent",
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
            //   <Text size="sm" opacity={0.8} align="center" c="red">
            //     waiting to join the IG Group
            //   </Text>
               <Button
                  size="lg"
                  variant="white"
                  leftSection={<IconPlus size={20} />}
                  onClick={() => navigate("/home")}
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
      </Stack>
    </Container>
  );
}

export default Welcome;