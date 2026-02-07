import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
    arbitrumSepolia,
    baseSepolia,
    optimismSepolia,
    sepolia,
} from 'wagmi/chains';
import { defineChain } from 'viem';
import { createStorage } from 'wagmi';

// Define Arc Testnet chain
const arcTestnet = defineChain({
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: {
        name: 'ARC',
        symbol: 'ARC',
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ['https://rpc.testnet.arc.network'] },
    },
    blockExplorers: {
        default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
    },
    testnet: true,
});

export const config = getDefaultConfig({
    appName: 'EZ - Easy Payments',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    chains: [
        sepolia,
        baseSepolia,
        optimismSepolia,
        arbitrumSepolia,
        arcTestnet,
    ],
    ssr: true,
    storage: createStorage({
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }),
});

// Chain display names
export const CHAIN_NAMES: Record<number, string> = {
    11155111: 'Ethereum Sepolia',
    84532: 'Base Sepolia',
    11155420: 'Optimism Sepolia',
    421614: 'Arbitrum Sepolia',
    5042002: 'Arc Testnet',
};

// Chain colors for UI
export const CHAIN_COLORS: Record<number, string> = {
    11155111: '#627EEA',
    84532: '#0052FF',
    11155420: '#FF0420',
    421614: '#28A0F0',
    5042002: '#8b5cf6',
};

// Supported tokens per chain
export const SUPPORTED_TOKENS: Record<number, Array<{ symbol: string, address: string, decimals: number }>> = {
    11155111: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
        { symbol: 'USDC', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 },
    ],
    84532: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
        { symbol: 'USDC', address: '0x3600000000000000000000000000000000000000', decimals: 6 },
    ],
    11155420: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    ],
    421614: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    ],
    5042002: [
        { symbol: 'USDC', address: '0x3600000000000000000000000000000000000000', decimals: 6 },
    ],
};
