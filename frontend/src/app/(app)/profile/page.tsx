'use client';

import { useState } from 'react';
import { User, Wallet, History, ChevronDown, ExternalLink, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { CHAIN_LOGOS } from '@/components/ChainLogos';

interface Transaction {
    id: string;
    type: 'send' | 'receive';
    amount: string;
    token: string;
    from: string;
    to: string;
    chain: string;
    date: string;
    status: 'success' | 'failed' | 'pending';
    txHash: string;
}

const mockTransactions: Transaction[] = [
    { id: '1', type: 'send', amount: '100', token: 'USDC', from: '0xYou...', to: 'alice.eth', chain: 'ethereum', date: '2026-02-05', status: 'success', txHash: '0xabc...def' },
    { id: '2', type: 'receive', amount: '50', token: 'USDC', from: 'bob.eth', to: '0xYou...', chain: 'base', date: '2026-02-04', status: 'success', txHash: '0x123...456' },
    { id: '3', type: 'send', amount: '25', token: 'USDC', from: '0xYou...', to: '0x9876...5432', chain: 'arbitrum', date: '2026-02-03', status: 'failed', txHash: '0x789...abc' },
    { id: '4', type: 'send', amount: '200', token: 'USDC', from: '0xYou...', to: 'charlie.eth', chain: 'polygon', date: '2026-02-02', status: 'success', txHash: '0xdef...123' },
    { id: '5', type: 'receive', amount: '75', token: 'USDC', from: 'dave.eth', to: '0xYou...', chain: 'optimism', date: '2026-02-01', status: 'success', txHash: '0x456...789' },
];

const chainBalances: Record<string, { usdc: string; native: string; nativeSymbol: string }> = {
    'Ethereum': { usdc: '1,234.56', native: '0.5', nativeSymbol: 'ETH' },
    'Arbitrum': { usdc: '500.00', native: '0.1', nativeSymbol: 'ETH' },
    'Optimism': { usdc: '250.00', native: '0.05', nativeSymbol: 'ETH' },
    'Base': { usdc: '789.12', native: '0.08', nativeSymbol: 'ETH' },
    'Polygon': { usdc: '150.00', native: '10', nativeSymbol: 'MATIC' },
};

export default function ProfilePage() {
    const [selectedChain, setSelectedChain] = useState('Ethereum');
    const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const chains = ['Ethereum', 'Arbitrum', 'Optimism', 'Base', 'Polygon'];
    const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f8bA93';

    const copyAddress = () => {
        navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const balance = chainBalances[selectedChain];
    const LogoComponent = CHAIN_LOGOS[selectedChain];

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                </div>
                <p className="text-gray-600">View your balances and transaction history</p>
            </div>

            {/* Wallet Card */}
            <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        <span className="font-medium">Connected Wallet</span>
                    </div>
                    <button
                        onClick={copyAddress}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
                    >
                        <span className="font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>

                {/* Chain Selector */}
                <div className="relative mb-4">
                    <button
                        onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                        className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors w-full"
                    >
                        <LogoComponent className="w-6 h-6" />
                        <span className="font-medium flex-1 text-left">{selectedChain}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isChainDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10">
                            {chains.map((chain) => {
                                const ChainLogo = CHAIN_LOGOS[chain];
                                return (
                                    <button
                                        key={chain}
                                        onClick={() => {
                                            setSelectedChain(chain);
                                            setIsChainDropdownOpen(false);
                                        }}
                                        className={`flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-50 transition-colors ${selectedChain === chain ? 'bg-indigo-50' : ''
                                            }`}
                                    >
                                        <ChainLogo className="w-6 h-6" />
                                        <span className="text-gray-900 font-medium">{chain}</span>
                                        {selectedChain === chain && (
                                            <CheckCircle2 className="w-4 h-4 text-indigo-600 ml-auto" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Balance Display */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-sm text-white/70 mb-1">USDC Balance</p>
                        <p className="text-3xl font-bold">${balance.usdc}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-sm text-white/70 mb-1">{balance.nativeSymbol} Balance</p>
                        <p className="text-3xl font-bold">{balance.native} {balance.nativeSymbol}</p>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-400" />
                    <h2 className="font-semibold text-gray-900">Transaction History</h2>
                </div>

                <div className="divide-y divide-gray-100">
                    {mockTransactions.map((tx) => (
                        <div key={tx.id} className="px-6 py-4 flex items-center gap-4">
                            {/* Type Icon */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'send' ? 'bg-red-100' : 'bg-green-100'
                                }`}>
                                <span className={`text-lg font-bold ${tx.type === 'send' ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                    {tx.type === 'send' ? '↑' : '↓'}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                        {tx.type === 'send' ? 'Sent to' : 'Received from'}
                                    </span>
                                    <span className="font-mono text-sm text-gray-600">
                                        {tx.type === 'send' ? tx.to : tx.from}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>{tx.date}</span>
                                    <span>•</span>
                                    <span className="capitalize">{tx.chain}</span>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right">
                                <p className={`font-semibold ${tx.type === 'send' ? 'text-red-600' : 'text-green-600'}`}>
                                    {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token}
                                </p>
                                <div className="flex items-center justify-end gap-1 text-xs">
                                    {tx.status === 'success' && (
                                        <span className="text-green-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Success
                                        </span>
                                    )}
                                    {tx.status === 'failed' && (
                                        <span className="text-red-600 flex items-center gap-1">
                                            <XCircle className="w-3 h-3" /> Failed
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* External Link */}
                            <a
                                href={`https://etherscan.io/tx/${tx.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
