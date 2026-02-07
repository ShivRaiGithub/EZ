'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { useTheme } from './ThemeProvider';
import { config } from '@/lib/wagmi';

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
