import { PrivyProvider as SDKPrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import React from 'react';
import { config } from '../services/wagmi';

// Main provider that wraps the SDK PrivyProvider
function PrivyProvider({ children }) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID;
  const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

  console.log('PrivyProvider rendering, appId:', appId);

  if (!appId) {
    console.error('VITE_PRIVY_APP_ID is not set in environment variables');
    return <div style={{ padding: '20px', color: 'red' }}>Error: Privy App ID not configured</div>;
  }

  return (
    <SDKPrivyProvider
      appId={appId}
      config={{
        loginMethods: ['wallet', 'email'],
        appearance: {
          theme: 'light',
        },
        walletConnectCloudProjectId: walletConnectProjectId,
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <WagmiProvider config={config}>
        {children}
      </WagmiProvider>
    </SDKPrivyProvider>
  );
}

export default PrivyProvider;