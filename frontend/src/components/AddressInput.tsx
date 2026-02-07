'use client';

import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, User, Globe } from 'lucide-react';
import { useAddressResolution } from '@/hooks/useAddressResolution';

interface AddressInputProps {
    value: string;
    onChange: (value: string) => void;
    onResolvedAddress?: (address: string | null, preferredChain?: string) => void;
    userAddress?: string;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
}

export function AddressInput({
    value,
    onChange,
    onResolvedAddress,
    userAddress,
    placeholder = '0x... or name.eth or contact name',
    label = 'Recipient Address',
    disabled = false,
}: AddressInputProps) {
    const resolved = useAddressResolution(value, userAddress);

    useEffect(() => {
        if (onResolvedAddress) {
            onResolvedAddress(resolved.address, resolved.preferredChain);
        }
    }, [resolved.address, resolved.preferredChain, onResolvedAddress]);

    const getStatusIcon = () => {
        if (!value || !value.trim()) return null;
        
        if (resolved.isLoading) {
            return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />;
        }
        
        if (resolved.error || !resolved.address) {
            return <AlertCircle className="w-4 h-4 text-red-500" />;
        }
        
        if (resolved.source === 'ens') {
            return (
                <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
            );
        }
        
        if (resolved.source === 'contact') {
            return (
                <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-purple-500" />
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
            );
        }
        
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    };

    const getResolvedInfo = () => {
        if (!value || !value.trim() || resolved.isLoading) return null;
        
        if (resolved.error || !resolved.address) {
            return (
                <p className="text-xs text-red-600 mt-1">
                    {resolved.error || 'Invalid address'}
                </p>
            );
        }
        
        if (resolved.source === 'ens') {
            return (
                <div className="text-xs text-blue-600 mt-1 space-y-0.5">
                    <p>✓ Resolved from ENS: {resolved.address.slice(0, 10)}...{resolved.address.slice(-8)}</p>
                    {resolved.preferredChain && (
                        <p className="text-green-600">✓ Preferred chain: {resolved.preferredChain}</p>
                    )}
                </div>
            );
        }
        
        if (resolved.source === 'contact') {
            return (
                <p className="text-xs text-purple-600 mt-1">
                    ✓ Loaded from contacts: {resolved.address.slice(0, 10)}...{resolved.address.slice(-8)}
                </p>
            );
        }
        
        if (resolved.source === 'direct') {
            return (
                <p className="text-xs text-green-600 mt-1">
                    ✓ Valid Ethereum address
                </p>
            );
        }
        
        return null;
    };

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="input-field w-full pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getStatusIcon()}
                </div>
            </div>
            {getResolvedInfo()}
        </div>
    );
}
