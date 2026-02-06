import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
    arbitrum,
    base,
    mainnet,
    optimism,
    polygon,
    arbitrumSepolia,
    baseSepolia,
    optimismSepolia,
    sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'EZ - Easy Payments',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    chains: [
        mainnet,
        arbitrum,
        optimism,
        base,
        polygon,
        sepolia,
        arbitrumSepolia,
        optimismSepolia,
        baseSepolia,
    ],
    ssr: true,
});

// Chain display names
export const CHAIN_NAMES: Record<number, string> = {
    1: 'Ethereum',
    10: 'Optimism',
    137: 'Polygon',
    8453: 'Base',
    42161: 'Arbitrum',
    11155111: 'Sepolia',
    11155420: 'Optimism Sepolia',
    84532: 'Base Sepolia',
    421614: 'Arbitrum Sepolia',
};

// Chain colors for UI
export const CHAIN_COLORS: Record<number, string> = {
    1: '#627EEA',
    10: '#FF0420',
    137: '#8247E5',
    8453: '#0052FF',
    42161: '#28A0F0',
    11155111: '#627EEA',
    11155420: '#FF0420',
    84532: '#0052FF',
    421614: '#28A0F0',
};

// Supported tokens per chain
export const SUPPORTED_TOKENS: Record<number, Array<{ symbol: string, address: string, decimals: number }>> = {
    1: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
        { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
        { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    ],
    42161: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
        { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
        { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
    ],
    10: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
        { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
        { symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
    ],
    8453: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
        { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    ],
    137: [
        { symbol: 'MATIC', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
        { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
        { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    ],
    11155111: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    ],
    421614: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    ],
    11155420: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    ],
    84532: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    ],
};
