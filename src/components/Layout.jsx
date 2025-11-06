import { useDisclosure } from '@mantine/hooks';
import { AppShell, Group, Burger, Button, Text } from '@mantine/core';
import { usePrivy } from '@privy-io/react-auth';
import Navbar from './Navbar';
import { useCreateIdentity } from './CreateIdentity';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

function Layout({ children }) {
  const [joinedTheGroup, setJoinedTheGroup] = useState(false);
  const [opened, { toggle }] = useDisclosure();
  const { login, logout, authenticated, ready } = usePrivy();
  const navigate = useNavigate();

  // Automatically create Semaphore identity after wallet connection
  useCreateIdentity((identity) => {
    console.log("✅ Identity created after wallet connection:", identity.commitment.toString());
  });

  // Update joinedTheGroup when authentication changes
  useEffect(() => {
    if (ready && authenticated) {
      setJoinedTheGroup(true);
      // Navigate to home after successful authentication
      navigate("/home");
    } else {
      setJoinedTheGroup(false);
    }
  }, [authenticated, ready, navigate]);

  const handleLogin = async () => {
    try {
      await login();
      // Don't navigate here - let the useEffect handle it when authenticated becomes true
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setJoinedTheGroup(false);
      navigate("/")
      
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AppShell
      header={{ height: 80 }}
      footer={{ height: 60 }}
      navbar={joinedTheGroup ? { width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } } : undefined}
      transitionDuration={350}
      transitionTimingFunction="ease"
      padding={0}
      style={{
        background: 'transparent'
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group>
            {joinedTheGroup && (
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            )}
             <Text 
                size="xl" 
                opacity={1} 
                align="center"
                style={{
                  fontWeight: 900
                }}
                c="black"
              >
                OMBU
              </Text>
          </Group>
          {authenticated ? (
            <Button onClick={handleLogout} variant="outline">
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleLogin}>
              Connect Wallet
            </Button>
          )}
        </Group>
      </AppShell.Header>
      {joinedTheGroup && (
        <AppShell.Navbar p="md">
          <Navbar />
        </AppShell.Navbar>
      )}
      <AppShell.Main 
        style={{ 
          position: 'relative', 
          width: '100%',
          maxWidth: '100%',
          flex: 1,
          background: 'linear-gradient(180deg, #2E86AB 0%, #A9D5B3 50%, #FFF9C4 100%)',
          minHeight: '100vh',
          backgroundAttachment: 'fixed'
        }}
      >
        <div style={{ width: '100%', padding: 20 }}>
          {children}
        </div>
      </AppShell.Main>
      <AppShell.Footer p="md" style={{ fontSize: '12px', textAlign: 'center' }} c="dimmed">© REDE 2025 - Powered by Blockchain</AppShell.Footer>
    </AppShell>
  );
}

export default Layout;