'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, arbitrum, optimism, base, polygon } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, connectorsForWallets, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, coinbaseWallet, walletConnectWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import '@rainbow-me/rainbowkit/styles.css';
import { useTheme } from './ThemeProvider';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

const connectors = connectorsForWallets(
    [
        {
            groupName: 'Popular',
            wallets: [
                metaMaskWallet,
                coinbaseWallet,
                walletConnectWallet,
                injectedWallet,
            ],
        },
    ],
    {
        appName: 'EZ Payments',
        projectId,
    }
);

// Create wagmi config with public RPC endpoints
const config = createConfig({
    connectors,
    chains: [mainnet, base, arbitrum, optimism, polygon, sepolia],
    transports: {
        [mainnet.id]: http('https://cloudflare-eth.com'),
        [base.id]: http('https://mainnet.base.org'),
        [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
        [optimism.id]: http('https://mainnet.optimism.io'),
        [polygon.id]: http('https://polygon-bor-rpc.publicnode.com'),
        [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    },
    ssr: true,
});

// Create query client
const queryClient = new QueryClient();

// Custom RainbowKit themes
const customDarkTheme = darkTheme({
    accentColor: '#8b5cf6',
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
});

const customLightTheme = lightTheme({
    accentColor: '#6366f1',
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
});

function RainbowKitWrapper({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();

    return (
        <RainbowKitProvider theme={theme === 'dark' ? customDarkTheme : customLightTheme}>
            {children}
        </RainbowKitProvider>
    );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitWrapper>
                    {children}
                </RainbowKitWrapper>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
