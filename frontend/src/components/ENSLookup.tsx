'use client';

import { useState } from 'react';
import { useENSLookup } from '@/hooks/useENS';
import { shortenAddress } from '@/lib/utils';
import {
    Search,
    Loader2,
    Copy,
    ExternalLink,
    CheckCircle2,
    User,
    Twitter,
    Github,
    Mail,
    Globe,
    Wallet,
    Layers
} from 'lucide-react';

interface ENSLookupProps {
    onSelectAddress?: (address: string, ensName: string) => void;
}

export function ENSLookup({ onSelectAddress }: ENSLookupProps) {
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [copied, setCopied] = useState(false);

    const { profile, isLoading, error } = useENSLookup(searchTerm || undefined);

    const handleSearch = () => {
        if (searchInput.trim()) {
            setSearchTerm(searchInput.trim());
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const copyAddress = () => {
        if (profile?.address) {
            navigator.clipboard.writeText(profile.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSelect = () => {
        if (onSelectAddress && profile?.address) {
            onSelectAddress(profile.address, profile.ensName || '');
        }
    };

    return (
        <div className="card-glass p-6 md:p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">ENS Lookup</h2>
                    <p className="text-gray-600">View payment preferences</p>
                </div>
            </div>

            {/* Search Input */}
            <div className="mb-6">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Enter ENS name (e.g., vitalik.eth)"
                        className="input-field flex-1"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !searchInput.trim()}
                        className="btn-primary px-6 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-box mb-6">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* Profile Display */}
            {profile && (
                <div className="space-y-6">
                    {/* Header with Avatar */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        {profile.avatar ? (
                            <img
                                src={profile.avatar}
                                alt={profile.ensName || 'Avatar'}
                                className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-200"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                                <User className="w-8 h-8 text-indigo-600" />
                            </div>
                        )}
                        <div className="flex-1">
                            {profile.ensName && (
                                <p className="text-lg font-bold text-gray-900">{profile.ensName}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                                <code className="text-sm text-gray-600 font-mono">
                                    {shortenAddress(profile.address, 6)}
                                </code>
                                <button
                                    onClick={copyAddress}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="Copy address"
                                >
                                    {copied ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-gray-500" />
                                    )}
                                </button>
                                <a
                                    href={`https://etherscan.io/address/${profile.address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="View on Etherscan"
                                >
                                    <ExternalLink className="w-4 h-4 text-gray-500" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Payment Preferences */}
                    {profile.preferences && (
                        <div className="preference-found">
                            <div className="flex items-center gap-2 mb-3">
                                <Wallet className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-green-700">Payment Preferences</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">Chain:</span>
                                    <span className="text-sm font-semibold text-gray-900 capitalize">
                                        {profile.preferences.chain}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Token:</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {profile.preferences.token}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Social Links */}
                    {profile.records && Object.values(profile.records).some(v => v) && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Social & Links</p>
                            <div className="flex flex-wrap gap-2">
                                {profile.records.twitter && (
                                    <a
                                        href={`https://twitter.com/${profile.records.twitter}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="record-link"
                                    >
                                        <Twitter className="w-4 h-4" />
                                        @{profile.records.twitter}
                                    </a>
                                )}
                                {profile.records.github && (
                                    <a
                                        href={`https://github.com/${profile.records.github}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="record-link"
                                    >
                                        <Github className="w-4 h-4" />
                                        {profile.records.github}
                                    </a>
                                )}
                                {profile.records.email && (
                                    <a
                                        href={`mailto:${profile.records.email}`}
                                        className="record-link"
                                    >
                                        <Mail className="w-4 h-4" />
                                        {profile.records.email}
                                    </a>
                                )}
                                {profile.records.url && (
                                    <a
                                        href={profile.records.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="record-link"
                                    >
                                        <Globe className="w-4 h-4" />
                                        Website
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {profile.records?.description && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Bio</p>
                            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                                {profile.records.description}
                            </p>
                        </div>
                    )}

                    {/* Select Button */}
                    {onSelectAddress && profile.address && (
                        <button
                            onClick={handleSelect}
                            className="w-full btn-primary py-3"
                        >
                            Use this address for payment
                        </button>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!profile && !isLoading && !error && searchTerm && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No profile found for this name</p>
                </div>
            )}

            {/* Initial State */}
            {!searchTerm && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Search className="w-8 h-8 text-indigo-400" />
                    </div>
                    <p className="text-gray-600">Enter an ENS name to view their profile and payment preferences</p>
                </div>
            )}
        </div>
    );
}
