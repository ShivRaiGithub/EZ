'use client';

import { useState } from 'react';
import { RefreshCw, Plus, Users, Settings, History, Loader2, CheckCircle2, Trash2, Pause, Play } from 'lucide-react';

interface AutoPayment {
    id: string;
    recipient: string;
    amount: string;
    frequency: string;
    destinationChain: string;
    status: 'active' | 'paused';
    nextPayment: string;
}

interface PaymentHistory {
    id: string;
    recipient: string;
    amount: string;
    date: string;
    status: 'success' | 'failed';
    txHash: string;
}

const mockAutoPayments: AutoPayment[] = [
    { id: '1', recipient: 'alice.eth', amount: '100', frequency: 'monthly', destinationChain: 'ethereum', status: 'active', nextPayment: '2026-03-06' },
    { id: '2', recipient: '0x1234...5678', amount: '50', frequency: 'weekly', destinationChain: 'base', status: 'paused', nextPayment: '2026-02-13' },
];

const mockHistory: PaymentHistory[] = [
    { id: '1', recipient: 'alice.eth', amount: '100', date: '2026-02-01', status: 'success', txHash: '0xabc...def' },
    { id: '2', recipient: '0x1234...5678', amount: '50', date: '2026-01-30', status: 'success', txHash: '0x123...456' },
    { id: '3', recipient: 'bob.eth', amount: '25', date: '2026-01-28', status: 'failed', txHash: '' },
];

export default function AutoPayPage() {
    const [tab, setTab] = useState<'setup' | 'manage' | 'history'>('setup');
    const [mode, setMode] = useState<'single' | 'multi'>('single');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [destinationChain, setDestinationChain] = useState('ethereum');
    const [autoPayments, setAutoPayments] = useState<AutoPayment[]>(mockAutoPayments);
    const [isLoading, setIsLoading] = useState(false);

    const chains = [
        { id: 'ethereum', name: 'Ethereum' },
        { id: 'arbitrum', name: 'Arbitrum' },
        { id: 'optimism', name: 'Optimism' },
        { id: 'base', name: 'Base' },
        { id: 'polygon', name: 'Polygon' },
    ];

    const frequencies = [
        { id: 'daily', name: 'Daily' },
        { id: 'weekly', name: 'Weekly' },
        { id: 'monthly', name: 'Monthly' },
        { id: 'yearly', name: 'Yearly' },
    ];

    const handleCreate = async () => {
        if (!recipient || !amount) return;
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setAutoPayments([
            ...autoPayments,
            {
                id: Date.now().toString(),
                recipient,
                amount,
                frequency,
                destinationChain,
                status: 'active',
                nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
        ]);
        setRecipient('');
        setAmount('');
        setIsLoading(false);
        setTab('manage');
    };

    const toggleStatus = (id: string) => {
        setAutoPayments(
            autoPayments.map((p) =>
                p.id === id ? { ...p, status: p.status === 'active' ? 'paused' : 'active' } : p
            )
        );
    };

    const deletePayment = (id: string) => {
        setAutoPayments(autoPayments.filter((p) => p.id !== id));
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Auto Payments</h1>
                </div>
                <p className="text-gray-600">Set up and manage recurring payments</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
                <button
                    onClick={() => setTab('setup')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'setup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Plus className="w-4 h-4" />
                    Setup
                </button>
                <button
                    onClick={() => setTab('manage')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'manage' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Settings className="w-4 h-4" />
                    Manage
                </button>
                <button
                    onClick={() => setTab('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <History className="w-4 h-4" />
                    History
                </button>
            </div>

            {/* Setup Tab */}
            {tab === 'setup' && (
                <div>
                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMode('single')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'single'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Single Recipient
                        </button>
                        <button
                            onClick={() => setMode('multi')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'multi'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Multi Recipients
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Recipient Address
                                </label>
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    placeholder="0x... or ENS name"
                                    className="input-field w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount (USDC)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="input-field w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Frequency
                                </label>
                                <select
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                    className="input-field w-full"
                                >
                                    {frequencies.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Destination Chain
                                </label>
                                <select
                                    value={destinationChain}
                                    onChange={(e) => setDestinationChain(e.target.value)}
                                    className="input-field w-full"
                                >
                                    {chains.map((chain) => (
                                        <option key={chain.id} value={chain.id}>
                                            {chain.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={isLoading || !recipient || !amount}
                            className="w-full btn-primary py-3 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Auto Payment
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Manage Tab */}
            {tab === 'manage' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {autoPayments.length === 0 ? (
                        <div className="p-12 text-center">
                            <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No auto payments set up yet</p>
                            <button onClick={() => setTab('setup')} className="mt-4 btn-primary">
                                Create One
                            </button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Recipient</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Frequency</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Chain</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {autoPayments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{payment.recipient}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{payment.amount} USDC</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">{payment.frequency}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">{payment.destinationChain}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}
                                            >
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => toggleStatus(payment.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                                >
                                                    {payment.status === 'active' ? (
                                                        <Pause className="w-4 h-4 text-gray-500" />
                                                    ) : (
                                                        <Play className="w-4 h-4 text-gray-500" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => deletePayment(payment.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* History Tab */}
            {tab === 'history' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Recipient</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tx Hash</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {mockHistory.map((tx) => (
                                <tr key={tx.id}>
                                    <td className="px-6 py-4 text-sm text-gray-600">{tx.date}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{tx.recipient}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{tx.amount} USDC</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'success'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}
                                        >
                                            {tx.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : null}
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{tx.txHash || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
