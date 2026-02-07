'use client';

import { useEffect, useState, useCallback } from 'react';
import { PaymentPreferences, ENSProfile } from '@/types';
import { ethers } from 'ethers';

// Sepolia ENS contract addresses
const SEPOLIA_ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const SEPOLIA_PUBLIC_RESOLVER = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';

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

// Mock ENS data for demo purposes (fallback)
const MOCK_ENS_DATA: Record<string, ENSProfile> = {
    'vitalik.eth': {
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        ensName: 'vitalik.eth',
        avatar: 'https://pbs.twimg.com/profile_images/977496875887558661/L86xyLF4_400x400.jpg',
        preferences: {
            chain: 'sepolia',
            token: 'USDC',
        },
        records: {
            twitter: 'VitalikButerin',
            github: 'vbuterin',
            email: null,
            url: 'https://vitalik.eth.limo',
            description: 'Ethereum co-founder',
        },
    },
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

/**
 * Custom hook to fetch payment preferences from ENS text records
 */
export function useENSPaymentPreferences(ensName: string | undefined) {
    const [preferences, setPreferences] = useState<PaymentPreferences | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPreferences() {
            if (!ensName) {
                setPreferences(null);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 800));

                const mockProfile = MOCK_ENS_DATA[ensName.toLowerCase()];

                if (mockProfile?.preferences) {
                    setPreferences(mockProfile.preferences);
                } else if (ensName.endsWith('.eth')) {
                    // Generate demo preferences
                    setPreferences({
                        chain: 'optimism',
                        token: 'USDC',
                    });
                } else {
                    setError('No payment preferences found');
                    setPreferences(null);
                }
            } catch (err) {
                console.error('Error fetching ENS preferences:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
                setPreferences(null);
            } finally {
                setIsLoading(false);
            }
        }

        fetchPreferences();
    }, [ensName]);

    return { preferences, isLoading, error };
}

/**
 * Hook to resolve ENS name to address
 */
export function useENSAddress(ensName: string | undefined) {
    const [address, setAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function resolveAddress() {
            if (!ensName) {
                setAddress(null);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));

                const mockProfile = MOCK_ENS_DATA[ensName.toLowerCase()];

                if (mockProfile) {
                    setAddress(mockProfile.address);
                } else if (ensName.endsWith('.eth')) {
                    // Generate a demo address
                    setAddress('0x' + Math.random().toString(16).slice(2, 42).padEnd(40, '0'));
                } else {
                    setError('Could not resolve ENS name');
                    setAddress(null);
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
    }, [ensName]);

    return { address, isLoading, error };
}
