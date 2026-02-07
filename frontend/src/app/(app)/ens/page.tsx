'use client';

import { useState } from 'react';
import { Search, User, Globe2, Coins, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ENSData {
    name: string;
    address: string;
    avatar?: string;
    preferredChain?: string;
    preferredToken?: string;
    email?: string;
    twitter?: string;
    github?: string;
    website?: string;
}

const mockENSData: Record<string, ENSData> = {
    'vitalik.eth': {
        name: 'vitalik.eth',
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        preferredChain: 'ethereum',
        preferredToken: 'ETH',
        twitter: 'VitalikButerin',
        github: 'vbuterin',
        website: 'https://vitalik.ca',
    },
    'alice.eth': {
        name: 'alice.eth',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        preferredChain: 'base',
        preferredToken: 'USDC',
        email: 'alice@example.com',
    },
};

export default function ENSPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ENSData | null>(null);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!query) return;
        setIsLoading(true);
        setError('');
        setResult(null);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const ensName = query.endsWith('.eth') ? query : `${query}.eth`;
        const data = mockENSData[ensName.toLowerCase()];

        if (data) {
            setResult(data);
        } else {
            setError(`No ENS profile found for "${ensName}"`);
        }
        setIsLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Search className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">ENS Lookup</h1>
                </div>
                <p className="text-gray-600">Fetch payment preferences and profile data from ENS</p>
            </div>

            {/* Search Box */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    ENS Name
                </label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="vitalik.eth or just vitalik"
                        className="input-field flex-1"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !query}
                        className="btn-primary px-6 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-linear-to-r from-indigo-500 to-purple-600 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{result.name}</h2>
                                <p className="text-sm text-white/80 font-mono">
                                    {result.address.slice(0, 10)}...{result.address.slice(-8)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Preferences */}
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">Payment Preferences</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Globe2 className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Preferred Chain</p>
                                    <p className="font-medium text-gray-900 capitalize">
                                        {result.preferredChain || 'Not set'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Coins className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Preferred Token</p>
                                    <p className="font-medium text-gray-900">
                                        {result.preferredToken || 'Not set'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {result.preferredChain && (
                            <div className="mt-4 flex items-center gap-2 text-green-600 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Preferences found! Payments will be routed accordingly.
                            </div>
                        )}
                    </div>

                    {/* Social Links */}
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">Profile Info</h3>
                        <div className="space-y-3">
                            {result.email && (
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 text-sm w-20">Email</span>
                                    <span className="text-gray-900">{result.email}</span>
                                </div>
                            )}
                            {result.twitter && (
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 text-sm w-20">Twitter</span>
                                    <a href={`https://twitter.com/${result.twitter}`} className="text-indigo-600 hover:underline">
                                        @{result.twitter}
                                    </a>
                                </div>
                            )}
                            {result.github && (
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 text-sm w-20">GitHub</span>
                                    <a href={`https://github.com/${result.github}`} className="text-indigo-600 hover:underline">
                                        {result.github}
                                    </a>
                                </div>
                            )}
                            {result.website && (
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 text-sm w-20">Website</span>
                                    <a href={result.website} className="text-indigo-600 hover:underline">
                                        {result.website}
                                    </a>
                                </div>
                            )}
                            {!result.email && !result.twitter && !result.github && !result.website && (
                                <p className="text-gray-500 text-sm">No additional profile info available</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
