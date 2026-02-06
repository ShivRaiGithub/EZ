'use client';

import { useState, useCallback } from 'react';
import { PaymentQuote } from '@/types';

/**
 * Mock hook to get payment quotes on Arc
 * Replace with actual Arc integration later
 */
export function useArcQuote() {
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

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            const paymentQuote: PaymentQuote = {
                fromChain: params.fromChainId,
                toChain: params.toChainId,
                fromToken: params.fromTokenAddress,
                toToken: params.toTokenAddress,
                fromAmount: params.fromAmount,
                toAmount: params.fromAmount, // 1:1 for demo
                estimatedGas: '0.01', // USDC gas - very low on Arc
                route: { demo: true },
            };

            setQuote(paymentQuote);
            return paymentQuote;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get quote';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { quote, getQuote, isLoading, error, setQuote };
}

/**
 * Mock hook to execute payment on Arc
 */
export function useArcExecution() {
    const [status, setStatus] = useState<'idle' | 'approving' | 'executing' | 'success' | 'error'>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const executePayment = useCallback(async () => {
        try {
            setStatus('approving');
            setError(null);

            // Simulate approval
            await new Promise(resolve => setTimeout(resolve, 1000));

            setStatus('executing');

            // Simulate execution - Arc has sub-second finality
            await new Promise(resolve => setTimeout(resolve, 800));

            setStatus('success');
            setTxHash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to execute payment';
            setError(errorMessage);
            setStatus('error');
            throw err;
        }
    }, []);

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
        'arc': 1, // Arc mainnet (placeholder)
        'arc-testnet': 11155111, // Arc testnet
        'ethereum': 1,
        'optimism': 10,
        'polygon': 137,
        'base': 8453,
        'arbitrum': 42161,
    };

    return chainMap[chainName.toLowerCase()] || null;
}

/**
 * Helper function to get token address from symbol and chain
 */
export function getTokenAddress(chainId: number, symbol: string): string {
    if (symbol === 'ETH' || symbol === 'MATIC') {
        return '0x0000000000000000000000000000000000000000';
    }

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
