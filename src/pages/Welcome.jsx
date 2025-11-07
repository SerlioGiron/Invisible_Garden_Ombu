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
import welcomeBackground from "../assets/welcome-background.png";

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
            backgroundImage: `url(${welcomeBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            position: "relative",
          }}
        >
          <Stack align="center" justify="center" gap="md" style={{ minHeight: "400px", position: "relative", zIndex: 1 }}>
            <div style={{ 
              textAlign: "center",
              padding: "2rem",
              borderRadius: "12px",
              backdropFilter: "blur(10px)"
            }}>
              <Title size="h1" mb="md" align="center" c="black">
                Welcome to OMBU! 🚀
              </Title>
              <Text size="lg" align="center" c="black">
                The first decentralized zk social network for Invisible Garden members
              </Text>
              <Text size="md" opacity={0.9} align="center" c="black">
                Connect & share your honest feedback about the fellowship 
              </Text>
            </div>
            {authenticated ? (
           
               <Button
                  size="lg"
                  variant="white"
                  leftSection={<IconPlus size={20} />}
                  onClick={() => navigate("/home")}
                >
                  Go to Home
                </Button> 
            ) : (
              <Text 
                size="sm" 
                opacity={0.9} 
                align="center"
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  fontWeight: 600
                }}
                c="black"
              >
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