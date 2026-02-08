'use client';

import { useEffect, useState, useCallback } from 'react';
import { ENSProfile } from '@/types';
import { ethers } from 'ethers';

// Chain mapping for preferences
const CHAIN_PREFERENCE_MAP: Record<string, string> = {
    'sepolia': 'sepolia',
    'ethereumsepolia': 'sepolia',
    'basesepolia': 'base sepolia',
    'arctestnet': 'arctestnet',
    'optimismsepolia': 'optimism sepolia',
    'arbitrumsepolia': 'arbitrum sepolia',
    'polygonamoy': 'polygon amoy',
};

/**
 * Custom hook to fetch comprehensive ENS profile data from Sepolia testnet
 */
export function useENSLookup(ensNameOrAddress: string | undefined) {
    const [profile, setProfile] = useState<ENSProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lookup = useCallback(async () => {
        if (!ensNameOrAddress) {
            setProfile(null);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Use Sepolia RPC for ENS resolution
            const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
            
            let resolvedAddress: string | null = null;
            let ensName = '';
            let preferredChain = 'sepolia'; // default

            // Check if input is an ENS name
            if (ensNameOrAddress.endsWith('.eth')) {
                ensName = ensNameOrAddress;
                
                try {
                    // Resolve ENS name to address on Sepolia
                    resolvedAddress = await provider.resolveName(ensNameOrAddress);
                    
                    if (resolvedAddress) {
                        // Try to get text records for chain preference
                        const resolver = await provider.getResolver(ensNameOrAddress);
                        if (resolver) {
                            try {
                                const chainText = await resolver.getText('preferred_chain');
                                if (chainText && CHAIN_PREFERENCE_MAP[chainText.toLowerCase()]) {
                                    preferredChain = CHAIN_PREFERENCE_MAP[chainText.toLowerCase()];
                                }
                            } catch {
                                // Chain preference not set, use default
                            }
                        }
                    }
                } catch {
                    throw new Error('Could not resolve ENS name on Sepolia testnet');
                }
            } else if (ensNameOrAddress.startsWith('0x')) {
                // Input is an address
                resolvedAddress = ensNameOrAddress;
                
                try {
                    // Try reverse lookup
                    const lookupAddress = await provider.lookupAddress(ensNameOrAddress);
                    if (lookupAddress) {
                        ensName = lookupAddress;
                    }
                } catch {
                    // No ENS name for this address
                }
            } else {
                setError('Invalid ENS name or address');
                setProfile(null);
                return;
            }

            if (resolvedAddress) {
                setProfile({
                    address: resolvedAddress,
                    ensName: ensName,
                    avatar: null,
                    preferences: {
                        chain: preferredChain,
                        token: 'USDC',
                    },
                    records: {
                        twitter: null,
                        github: null,
                        email: null,
                        url: null,
                        description: null,
                    },
                });
            } else {
                setError('Could not resolve ENS name');
                setProfile(null);
            }
        } catch (err) {
            console.error('Error fetching ENS profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch ENS profile');
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, [ensNameOrAddress]);

    useEffect(() => {
        lookup();
    }, [lookup]);

    return { profile, isLoading, error, refetch: lookup };
}

