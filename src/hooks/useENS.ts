'use client';

import { useEffect, useState, useCallback } from 'react';
import { PaymentPreferences, ENSProfile } from '@/types';

// Mock ENS data for demo purposes
const MOCK_ENS_DATA: Record<string, ENSProfile> = {
    'vitalik.eth': {
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        ensName: 'vitalik.eth',
        avatar: 'https://pbs.twimg.com/profile_images/977496875887558661/L86xyLF4_400x400.jpg',
        preferences: {
            chain: 'optimism',
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
 * Custom hook to fetch comprehensive ENS profile data
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

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockProfile = MOCK_ENS_DATA[ensNameOrAddress.toLowerCase()];

            if (mockProfile) {
                setProfile(mockProfile);
            } else if (ensNameOrAddress.endsWith('.eth')) {
                // Generate a demo profile for any .eth name
                setProfile({
                    address: '0x' + Math.random().toString(16).slice(2, 42).padEnd(40, '0'),
                    ensName: ensNameOrAddress,
                    avatar: null,
                    preferences: {
                        chain: 'base',
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
            } else if (ensNameOrAddress.startsWith('0x')) {
                setProfile({
                    address: ensNameOrAddress,
                    ensName: '',
                    preferences: null,
                    records: {},
                });
            } else {
                setError('Invalid ENS name or address');
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
