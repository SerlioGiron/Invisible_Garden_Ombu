import { useDisclosure } from '@mantine/hooks';
import { AppShell, Group, Burger, Button } from '@mantine/core';
import { usePrivy } from '@privy-io/react-auth';
import Navbar from './Navbar';

function Layout({ children }) {
  const [opened, { toggle }] = useDisclosure();
  const { login, logout, authenticated } = usePrivy();

  return (
    <AppShell
      header={{ height: 80 }}
      footer={{ height: 60 }}
      navbar={authenticated ? { width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } } : undefined}
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
            {authenticated && (
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            )}
            <img src="src/assets/logo.png" alt="Logo" style={{ height: 90 }} />
          </Group>
          {authenticated ? (
            <Button onClick={logout} variant="outline">
              Disconnect
            </Button>
          ) : (
            <Button onClick={login}>
              Connect Wallet
            </Button>
          )}
        </Group>
      </AppShell.Header>
      {authenticated && (
        <AppShell.Navbar p="md">
          <Navbar />
        </AppShell.Navbar>
      )}
      <AppShell.Main style={{ 
        position: 'relative', 
        width: '100%',
        maxWidth: '100%',
        flex: 1,
        background: 'linear-gradient(180deg, #1E64FA 0%, #78B4F0 50%, #C8DCB4 75%, #FFF0B4 100%)',
        minHeight: '100vh'
      }}>
        <div style={{ width: '100%', maxWidth: '100%' }}>
          {children}
        </div>
      </AppShell.Main>
      <AppShell.Footer p="md" style={{ fontSize: '12px', textAlign: 'center' }} c="dimmed">© REDE 2025 - Powered by Blockchain</AppShell.Footer>
    </AppShell>
  );
}

export default Layout;