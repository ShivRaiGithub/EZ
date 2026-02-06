# Cross-Chain Payment System - Complete Technical Implementation Guide

## Project Overview

A Next.js application that enables seamless cross-chain cryptocurrency payments using ENS (Ethereum Name Service) for payment preferences and LI.FI for cross-chain routing.

**Core Concept:** Users can pay anyone by entering their ENS name. The system automatically reads the recipient's preferred chain and token from their ENS text records, then uses LI.FI to route the payment cross-chain.

---

## Tech Stack

### Frontend Framework
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**

### Web3 Libraries
- **wagmi** (v2.x) - React hooks for Ethereum
- **viem** (v2.x) - TypeScript Ethereum library
- **@rainbow-me/rainbowkit** (v2.x) - Wallet connection UI
- **@tanstack/react-query** (v5.x) - Data fetching
- **@lifi/sdk** (v3.x) - Cross-chain routing
- **@ensdomains/ensjs** (v4.x) - ENS integration

### Supported Chains
- Ethereum Mainnet
- Optimism
- Arbitrum
- Base
- Polygon
- Sepolia (testnet)
- Optimism Sepolia
- Base Sepolia
- Arbitrum Sepolia

---

## Project Structure

```
cross-chain-payments/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Home page
│   │   └── globals.css          # Global styles with Tailwind
│   ├── components/
│   │   ├── providers/
│   │   │   └── Web3Provider.tsx # Wagmi & RainbowKit setup
│   │   ├── PaymentForm.tsx      # Main payment interface
│   │   └── PreferencesHelper.tsx # ENS setup guide
│   ├── hooks/
│   │   ├── useENS.ts            # ENS text record hooks
│   │   └── useLiFi.ts           # LI.FI integration hooks
│   ├── lib/
│   │   ├── wagmi.ts             # Wagmi configuration
│   │   └── utils.ts             # Helper functions
│   └── types/
│       └── index.ts             # TypeScript types
├── public/
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── .env.local
```

---

## Complete Implementation

### 1. Package.json

```json
{
  "name": "cross-chain-payments",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next": "^14.2.0",
    "viem": "^2.21.53",
    "wagmi": "^2.12.29",
    "@tanstack/react-query": "^5.62.8",
    "@rainbow-me/rainbowkit": "^2.2.0",
    "@lifi/sdk": "^3.5.1",
    "@ensdomains/ensjs": "^4.0.2",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.1",
    "postcss": "^8",
    "autoprefixer": "^10.4.19",
    "eslint": "^8",
    "eslint-config-next": "^14.2.0"
  }
}
```

### 2. next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
```

### 3. tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### 4. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 5. .env.local

```bash
# WalletConnect Project ID (required)
# Get from: https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: Alchemy API key for better RPC
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
```

### 6. src/types/index.ts

```typescript
export interface PaymentPreferences {
  chain: string; // Chain name or ID
  token: string; // Token symbol
  address?: string; // Optional custom receiving address
}

export interface PaymentQuote {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  route: any; // LI.FI route object
}

export interface PaymentState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  txHash?: string;
}

export interface ENSProfile {
  address: string;
  ensName: string;
  preferences?: PaymentPreferences;
}

export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}
```

### 7. src/lib/wagmi.ts

```typescript
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
  appName: 'Cross-Chain Payments',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [
    mainnet,
    arbitrum,
    optimism,
    base,
    polygon,
    // Testnets
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

// Supported tokens per chain
export const SUPPORTED_TOKENS: Record<number, Array<{symbol: string, address: string, decimals: number}>> = {
  // Mainnet
  1: [
    { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  ],
  // Arbitrum
  42161: [
    { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
  ],
  // Optimism
  10: [
    { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    { symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
  ],
  // Base
  8453: [
    { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  ],
  // Polygon
  137: [
    { symbol: 'MATIC', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
  ],
};
```

### 8. src/lib/utils.ts

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTokenAmount(amount: string, decimals: number, displayDecimals = 4): string {
  const value = parseFloat(amount) / Math.pow(10, decimals);
  return value.toFixed(displayDecimals);
}
```

### 9. src/hooks/useENS.ts

```typescript
'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { normalize } from 'viem/ens';
import { PaymentPreferences } from '@/types';

/**
 * Custom hook to fetch payment preferences from ENS text records
 * 
 * ENS Text Records Schema:
 * - payment.chain: preferred chain (e.g., "optimism", "arbitrum", "base")
 * - payment.token: preferred token (e.g., "USDC", "ETH", "USDT")
 * - payment.address: optional custom receiving address
 */
export function useENSPaymentPreferences(ensName: string | undefined) {
  const [preferences, setPreferences] = useState<PaymentPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const publicClient = usePublicClient();

  useEffect(() => {
    async function fetchPreferences() {
      if (!ensName || !publicClient) {
        setPreferences(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const normalizedName = normalize(ensName);

        // Fetch text records in parallel
        const [chain, token, address] = await Promise.all([
          publicClient.getEnsText({
            name: normalizedName,
            key: 'payment.chain',
          }),
          publicClient.getEnsText({
            name: normalizedName,
            key: 'payment.token',
          }),
          publicClient.getEnsText({
            name: normalizedName,
            key: 'payment.address',
          }),
        ]);

        if (chain && token) {
          setPreferences({
            chain,
            token,
            address: address || undefined,
          });
        } else {
          setError('No payment preferences found for this ENS name');
          setPreferences(null);
        }
      } catch (err) {
        console.error('Error fetching ENS preferences:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ENS preferences');
        setPreferences(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, [ensName, publicClient]);

  return { preferences, isLoading, error };
}

/**
 * Hook to resolve ENS name to address
 */
export function useENSAddress(ensName: string | undefined) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const publicClient = usePublicClient();

  useEffect(() => {
    async function resolveAddress() {
      if (!ensName || !publicClient) {
        setAddress(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const normalizedName = normalize(ensName);
        const resolvedAddress = await publicClient.getEnsAddress({
          name: normalizedName,
        });

        setAddress(resolvedAddress || null);
        if (!resolvedAddress) {
          setError('Could not resolve ENS name');
        }
      } catch (err) {
        console.error('Error resolving ENS address:', err);
        setError(err instanceof Error ? err.message : 'Failed to resolve ENS name');
        setAddress(null);
      } finally {
        setIsLoading(false);
      }
    }

    resolveAddress();
  }, [ensName, publicClient]);

  return { address, isLoading, error };
}
```

### 10. src/hooks/useLiFi.ts

```typescript
'use client';

import { useState, useCallback } from 'react';
import { createConfig, LiFi, RouteOptions, RoutesRequest } from '@lifi/sdk';
import { useAccount, useWalletClient } from 'wagmi';
import { PaymentQuote } from '@/types';

// Initialize LI.FI SDK
const lifi = new LiFi(createConfig({
  integrator: 'cross-chain-payments-hackmoney',
}));

/**
 * Hook to get cross-chain payment quotes using LI.FI
 */
export function useLiFiQuote() {
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(async (params: {
    fromChainId: number;
    toChainId: number;
    fromTokenAddress: string;
    toTokenAddress: string;
    fromAmount: string;
    fromAddress: string;
    toAddress: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const routeRequest: RoutesRequest = {
        fromChainId: params.fromChainId,
        toChainId: params.toChainId,
        fromTokenAddress: params.fromTokenAddress,
        toTokenAddress: params.toTokenAddress,
        fromAmount: params.fromAmount,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        options: {
          slippage: 0.03, // 3% slippage tolerance
          order: 'FASTEST', // Prioritize speed
        } as RouteOptions,
      };

      const routes = await lifi.getRoutes(routeRequest);
      
      if (!routes.routes || routes.routes.length === 0) {
        throw new Error('No routes found for this payment');
      }

      // Get the best route (first one)
      const bestRoute = routes.routes[0];

      const paymentQuote: PaymentQuote = {
        fromChain: params.fromChainId,
        toChain: params.toChainId,
        fromToken: params.fromTokenAddress,
        toToken: params.toTokenAddress,
        fromAmount: params.fromAmount,
        toAmount: bestRoute.toAmount,
        estimatedGas: bestRoute.gasCostUSD || '0',
        route: bestRoute,
      };

      setQuote(paymentQuote);
      return paymentQuote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get quote';
      setError(errorMessage);
      console.error('LI.FI quote error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { quote, getQuote, isLoading, error };
}

/**
 * Hook to execute cross-chain payment using LI.FI
 */
export function useLiFiExecution() {
  const [status, setStatus] = useState<'idle' | 'approving' | 'executing' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const executePayment = useCallback(async (route: any) => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      setStatus('approving');
      setError(null);

      // Execute the route
      // LI.FI will handle approvals and the actual cross-chain transfer
      const execution = await lifi.executeRoute(route, {
        updateRouteHook: (updatedRoute) => {
          console.log('Route updated:', updatedRoute);
        },
      });

      setStatus('executing');

      // Wait for execution to complete
      for await (const update of execution) {
        console.log('Execution update:', update);
        
        if (update.status === 'DONE') {
          setStatus('success');
          setTxHash(update.txHash || null);
          return update;
        }
        
        if (update.status === 'FAILED') {
          throw new Error(update.error || 'Transaction failed');
        }
      }

      setStatus('success');
      return execution;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute payment';
      setError(errorMessage);
      setStatus('error');
      console.error('LI.FI execution error:', err);
      throw err;
    }
  }, [walletClient, address]);

  const reset = useCallback(() => {
    setStatus('idle');
    setTxHash(null);
    setError(null);
  }, []);

  return { executePayment, status, txHash, error, reset };
}

/**
 * Helper function to get chain ID from chain name
 */
export function getChainIdFromName(chainName: string): number | null {
  const chainMap: Record<string, number> = {
    'ethereum': 1,
    'optimism': 10,
    'polygon': 137,
    'base': 8453,
    'arbitrum': 42161,
    'sepolia': 11155111,
    'optimism-sepolia': 11155420,
    'base-sepolia': 84532,
    'arbitrum-sepolia': 421614,
  };

  return chainMap[chainName.toLowerCase()] || null;
}

/**
 * Helper function to get token address from symbol and chain
 */
export function getTokenAddress(chainId: number, symbol: string): string {
  // Native tokens
  if (symbol === 'ETH' || symbol === 'MATIC') {
    return '0x0000000000000000000000000000000000000000';
  }

  // Token addresses per chain (USDC, USDT, etc.)
  const tokenAddresses: Record<number, Record<string, string>> = {
    1: {
      'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
    42161: {
      'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    },
    10: {
      'USDC': '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      'USDT': '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    },
    8453: {
      'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    137: {
      'USDC': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    },
  };

  return tokenAddresses[chainId]?.[symbol.toUpperCase()] || '0x0000000000000000000000000000000000000000';
}
```

### 11. src/components/providers/Web3Provider.tsx

```typescript
'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { ReactNode } from 'react';

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
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
```

### 12. src/components/PaymentForm.tsx

```typescript
'use client';

import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useENSPaymentPreferences, useENSAddress } from '@/hooks/useENS';
import { useLiFiQuote, useLiFiExecution, getChainIdFromName, getTokenAddress } from '@/hooks/useLiFi';
import { CHAIN_NAMES, SUPPORTED_TOKENS } from '@/lib/wagmi';
import { ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function PaymentForm() {
  const { address, chain } = useAccount();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('USDC');

  // ENS hooks
  const { preferences, isLoading: ensLoading, error: ensError } = useENSPaymentPreferences(
    recipient.endsWith('.eth') ? recipient : undefined
  );
  const { address: recipientAddress } = useENSAddress(
    recipient.endsWith('.eth') ? recipient : undefined
  );

  // LI.FI hooks
  const { quote, getQuote, isLoading: quoteLoading } = useLiFiQuote();
  const { executePayment, status, txHash, error: execError, reset } = useLiFiExecution();

  // Get user's balance for selected token
  const currentChainTokens = chain ? SUPPORTED_TOKENS[chain.id] : [];
  const selectedTokenData = currentChainTokens.find(t => t.symbol === selectedToken);
  
  const { data: balance } = useBalance({
    address,
    token: selectedTokenData?.address === '0x0000000000000000000000000000000000000000' 
      ? undefined 
      : selectedTokenData?.address as `0x${string}`,
  });

  // Handle quote generation
  const handleGetQuote = async () => {
    if (!chain || !address || !amount || !preferences || !recipientAddress) {
      return;
    }

    const toChainId = getChainIdFromName(preferences.chain);
    if (!toChainId) {
      alert(`Unsupported chain: ${preferences.chain}`);
      return;
    }

    const fromTokenAddress = getTokenAddress(chain.id, selectedToken);
    const toTokenAddress = getTokenAddress(toChainId, preferences.token);

    try {
      const decimals = selectedTokenData?.decimals || 18;
      const amountInWei = parseUnits(amount, decimals);

      await getQuote({
        fromChainId: chain.id,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        fromAmount: amountInWei.toString(),
        fromAddress: address,
        toAddress: preferences.address || recipientAddress,
      });
    } catch (err) {
      console.error('Failed to get quote:', err);
    }
  };

  // Handle payment execution
  const handlePay = async () => {
    if (!quote) return;

    try {
      await executePayment(quote.route);
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  const handleReset = () => {
    setAmount('');
    reset();
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Send Payment</h2>

      {/* Recipient Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recipient (ENS name or address)
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="vitalik.eth or 0x..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        
        {ensLoading && (
          <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading ENS preferences...
          </p>
        )}
        
        {ensError && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {ensError}
          </p>
        )}
        
        {preferences && (
          <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-1">
              ✓ Payment Preferences Found
            </p>
            <p className="text-sm text-green-700">
              Will receive <span className="font-semibold">{preferences.token}</span> on{' '}
              <span className="font-semibold">{preferences.chain}</span>
            </p>
          </div>
        )}
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {currentChainTokens.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>
        
        {balance && (
          <p className="mt-2 text-sm text-gray-600">
            Balance: {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} {balance.symbol}
          </p>
        )}
      </div>

      {/* Current Chain Info */}
      {chain && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Sending from: <span className="font-semibold text-gray-900">{CHAIN_NAMES[chain.id]}</span>
          </p>
        </div>
      )}

      {/* Quote Display */}
      {quote && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Quote Details</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">You send:</span>
              <span className="text-sm font-semibold text-blue-900">
                {formatUnits(BigInt(quote.fromAmount), selectedTokenData?.decimals || 18)} {selectedToken}
              </span>
            </div>
            
            <div className="flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">They receive:</span>
              <span className="text-sm font-semibold text-blue-900">
                {formatUnits(BigInt(quote.toAmount), 6)} {preferences?.token}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-blue-200">
              <span className="text-sm text-blue-700">Est. gas cost:</span>
              <span className="text-sm font-semibold text-blue-900">
                ${parseFloat(quote.estimatedGas).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!quote ? (
          <button
            onClick={handleGetQuote}
            disabled={!address || !preferences || !amount || quoteLoading || ensLoading}
            className="w-full py-4 px-6 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {quoteLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting Quote...
              </>
            ) : (
              'Get Quote'
            )}
          </button>
        ) : status === 'idle' ? (
          <button
            onClick={handlePay}
            className="w-full py-4 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Confirm & Send Payment
          </button>
        ) : status === 'success' ? (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Payment Successful!</p>
                {txHash && (
                  <p className="text-sm text-green-700 mt-1">
                    Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-3 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Send Another Payment
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full py-4 px-6 bg-gray-300 text-gray-600 font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            {status === 'approving' ? 'Approving...' : 'Processing Payment...'}
          </button>
        )}
      </div>

      {/* Error Display */}
      {execError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{execError}</p>
        </div>
      )}
    </div>
  );
}
```

### 13. src/components/PreferencesHelper.tsx

```typescript
'use client';

import { useState } from 'react';
import { ExternalLink, Copy, CheckCircle } from 'lucide-react';

export function PreferencesHelper() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const textRecords = [
    {
      key: 'payment.chain',
      value: 'optimism',
      description: 'Your preferred chain (optimism, arbitrum, base, polygon, ethereum)',
    },
    {
      key: 'payment.token',
      value: 'USDC',
      description: 'Your preferred token (USDC, ETH, USDT)',
    },
    {
      key: 'payment.address',
      value: '0x... (optional)',
      description: 'Custom receiving address (optional, defaults to ENS owner)',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        📝 Set Up Your Payment Preferences
      </h2>
      
      <p className="text-gray-600 mb-6">
        To receive payments, you need to set payment preferences in your ENS profile.
        Follow these steps:
      </p>

      {/* Step-by-step guide */}
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="border-l-4 border-primary-500 pl-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            Step 1: Go to ENS App
          </h3>
          <a
            href="https://app.ens.domains"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            Open app.ens.domains
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Step 2 */}
        <div className="border-l-4 border-primary-500 pl-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            Step 2: Connect Wallet & Select Your Name
          </h3>
          <p className="text-gray-600">
            Connect your wallet and click on your ENS name
          </p>
        </div>

        {/* Step 3 */}
        <div className="border-l-4 border-primary-500 pl-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            Step 3: Add Text Records
          </h3>
          <p className="text-gray-600 mb-3">
            Go to "Records" tab → "Add/Edit Record" → "Text"
          </p>
          
          <div className="space-y-3">
            {textRecords.map((record) => (
              <div key={record.key} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {record.key}
                      </span>
                      <button
                        onClick={() => copyToClipboard(record.key, record.key)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {copied === record.key ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600">
                      {record.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-200 text-sm">
                    {record.value}
                  </code>
                  <button
                    onClick={() => copyToClipboard(record.value, `${record.key}-value`)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {copied === `${record.key}-value` ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 4 */}
        <div className="border-l-4 border-primary-500 pl-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            Step 4: Save Changes
          </h3>
          <p className="text-gray-600">
            Click "Save" and confirm the transaction in your wallet
          </p>
        </div>
      </div>

      {/* Supported Options */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-3">Supported Options</h4>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-blue-800 mb-2">Chains:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• ethereum</li>
              <li>• optimism</li>
              <li>• arbitrum</li>
              <li>• base</li>
              <li>• polygon</li>
            </ul>
          </div>
          
          <div>
            <p className="text-sm font-medium text-blue-800 mb-2">Tokens:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• ETH</li>
              <li>• USDC</li>
              <li>• USDT</li>
              <li>• MATIC (Polygon only)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-2">✅ Example Setup</h4>
        <p className="text-sm text-green-800">
          If you set <code className="bg-green-100 px-2 py-1 rounded">payment.chain = optimism</code> and{' '}
          <code className="bg-green-100 px-2 py-1 rounded">payment.token = USDC</code>, 
          anyone paying you will automatically send to your Optimism address, 
          and the system will convert their payment to USDC - regardless of what chain 
          or token they're using!
        </p>
      </div>
    </div>
  );
}
```

### 14. src/app/layout.tsx

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/providers/Web3Provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cross-Chain Payments | Pay anyone, any chain",
  description: "Send crypto payments that automatically route to your recipient's preferred chain and token using ENS and LI.FI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
```

### 15. src/app/page.tsx

```typescript
import { PaymentForm } from "@/components/PaymentForm";
import { PreferencesHelper } from "@/components/PreferencesHelper";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cross-Chain Payments
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Pay anyone, any chain, instantly
              </p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Pay anyone on their preferred chain
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simply enter an ENS name. We'll automatically route your payment to their
            preferred chain and token using LI.FI's cross-chain infrastructure.
          </p>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary-600">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Receiver Sets Preferences
            </h3>
            <p className="text-gray-600">
              Set your preferred chain and token in your ENS profile using text records
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary-600">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sender Pays Anywhere
            </h3>
            <p className="text-gray-600">
              Pay from any supported chain with any token - no manual bridging needed
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary-600">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Auto-Routing Magic
            </h3>
            <p className="text-gray-600">
              LI.FI automatically routes the payment cross-chain to the receiver's preference
            </p>
          </div>
        </div>

        {/* Payment Form */}
        <PaymentForm />

        {/* Preferences Helper */}
        <PreferencesHelper />

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🎯 Powered by ENS
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Decentralized payment preferences</li>
              <li>✓ Human-readable addresses</li>
              <li>✓ User-controlled settings</li>
              <li>✓ No centralized database needed</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ⚡ Powered by LI.FI
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Best cross-chain routes</li>
              <li>✓ Automatic bridge selection</li>
              <li>✓ Optimal swap routing</li>
              <li>✓ Multi-chain support</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            Built for ETHGlobal HackMoney 2026 🚀
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            Integrating ENS + LI.FI for seamless cross-chain payments
          </p>
        </div>
      </footer>
    </div>
  );
}
```

### 16. src/app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}
```

---

## ENS Text Records Schema

Recipients must set these text records in their ENS profile:

```
Key: payment.chain
Value: optimism | arbitrum | base | polygon | ethereum

Key: payment.token
Value: USDC | ETH | USDT | MATIC

Key: payment.address (optional)
Value: 0x... (custom receiving address)
```

**How to set:**
1. Go to https://app.ens.domains
2. Connect wallet
3. Click on your ENS name
4. Records tab → Add/Edit Record → Text
5. Add the keys and values above
6. Save and confirm transaction

---

## LI.FI Integration Flow

1. **Get Quote:** User inputs recipient, amount, token
2. **Read ENS:** Fetch payment preferences from ENS text records
3. **Route Selection:** LI.FI finds best route from sender's chain/token to receiver's preference
4. **Execution:** LI.FI handles approvals, swaps, bridges automatically
5. **Confirmation:** Receiver gets funds on their preferred chain/token

---

## Key Features

1. **Chain Abstraction:** Sender doesn't need to know receiver's chain
2. **Decentralized Config:** ENS text records (no database)
3. **Automatic Routing:** LI.FI finds optimal cross-chain path
4. **Multi-chain Support:** 5+ mainnets + testnets
5. **Production Ready:** Error handling, loading states, transaction tracking

---

## Setup & Run

```bash
# Install dependencies
npm install

# Create .env.local with WalletConnect Project ID
cp .env.example .env.local

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Testing Flow

1. Set up testnet ENS with payment preferences
2. Get test tokens from faucets
3. Connect wallet to testnet
4. Enter ENS name as recipient
5. Select amount and token
6. Get quote
7. Execute payment
8. Verify cross-chain transfer

---

## Future Enhancements

1. **Yellow Network Integration** for session-based micropayments
2. Payment links (pay.xyz/alice.eth)
3. Batch payments to multiple recipients
4. Payment history and analytics
5. Mobile app

---

## Prize Eligibility

- **LI.FI Prize:** Deep integration with cross-chain routing
- **ENS Prize:** Novel use of text records for payment config
- **Yellow Network:** (Future) Session-based micropayments

---

This complete implementation can be recreated by any AI assistant with access to this document.
