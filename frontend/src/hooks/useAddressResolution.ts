'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { savedAddressApi } from '@/lib/api';

interface ResolvedAddress {
    address: string | null;
    displayName: string;
    source: 'direct' | 'ens' | 'contact';
    preferredChain?: string;
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook to resolve address input from:
 * 1. Direct wallet address (0x...)
 * 2. ENS name (.eth) - using Sepolia testnet
 * 3. Saved contact name
 */
export function useAddressResolution(input: string, userAddress?: string) {
    const [resolved, setResolved] = useState<ResolvedAddress>({
        address: null,
        displayName: '',
        source: 'direct',
        isLoading: false,
        error: null,
    });

    useEffect(() => {
        const resolveAddress = async () => {
            if (!input || !input.trim()) {
                setResolved({
                    address: null,
                    displayName: '',
                    source: 'direct',
                    isLoading: false,
                    error: null,
                });
                return;
            }

            setResolved(prev => ({ ...prev, isLoading: true, error: null }));

            try {
                const trimmedInput = input.trim();

                // Check if it's a direct Ethereum address
                if (trimmedInput.startsWith('0x') && ethers.isAddress(trimmedInput)) {
                    setResolved({
                        address: trimmedInput,
                        displayName: trimmedInput,
                        source: 'direct',
                        isLoading: false,
                        error: null,
                    });
                    return;
                }

                // Check if it's an ENS name
                if (trimmedInput.endsWith('.eth')) {
                    try {
                        const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
                        const resolvedAddr = await provider.resolveName(trimmedInput);

                        if (resolvedAddr) {
                            // Try to get chain preference from ENS text records
                            let preferredChain = 'sepolia';
                            try {
                                const resolver = await provider.getResolver(trimmedInput);
                                if (resolver) {
                                    const chainText = await resolver.getText('preferred_chain');
                                    if (chainText) {
                                        const chainMap: Record<string, string> = {
                                            'sepolia': 'sepolia',
                                            'ethereumsepolia': 'sepolia',
                                            'basesepolia': 'base sepolia',
                                            'arctestnet': 'arctestnet',
                                            'optimismsepolia': 'optimism sepolia',
                                            'arbitrumsepolia': 'arbitrum sepolia',
                                            'polygonamoy': 'polygon amoy',
                                        };
                                        preferredChain = chainMap[chainText.toLowerCase()] || 'sepolia';
                                    }
                                }
                            } catch {
                                // Chain preference not set
                            }

                            setResolved({
                                address: resolvedAddr,
                                displayName: trimmedInput,
                                source: 'ens',
                                preferredChain,
                                isLoading: false,
                                error: null,
                            });
                            return;
                        }
                    } catch (ensError) {
                        console.error('ENS resolution error:', ensError);
                        // Continue to check saved contacts as fallback
                    }
                }

                // Check saved contacts
                if (userAddress) {
                    try {
                        const response = await savedAddressApi.getAll(userAddress);
                        if (response.data.success) {
                            const contacts = response.data.savedAddresses;
                            const matchingContact = contacts.find(
                                (c: { name: string; address: string }) => c.name.toLowerCase() === trimmedInput.toLowerCase()
                            );

                            if (matchingContact) {
                                setResolved({
                                    address: matchingContact.address,
                                    displayName: matchingContact.name,
                                    source: 'contact',
                                    isLoading: false,
                                    error: null,
                                });
                                return;
                            }
                        }
                    } catch (contactError) {
                        console.error('Contact lookup error:', contactError);
                    }
                }

                // If we got here, nothing resolved
                setResolved({
                    address: null,
                    displayName: trimmedInput,
                    source: 'direct',
                    isLoading: false,
                    error: 'Could not resolve address from input',
                });

            } catch (error) {
                setResolved({
                    address: null,
                    displayName: input,
                    source: 'direct',
                    isLoading: false,
                    error: error instanceof Error ? error.message : 'Failed to resolve address',
                });
            }
        };

        // Debounce the resolution
        const timeoutId = setTimeout(() => {
            resolveAddress();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [input, userAddress]);

    return resolved;
}
