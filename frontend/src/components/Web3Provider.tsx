'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, arbitrum, optimism, base, polygon } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, coinbaseWallet, walletConnectWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import '@rainbow-me/rainbowkit/styles.css';

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

// Create wagmi config with public RPC endpoints (not blocked by adblockers)
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

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
