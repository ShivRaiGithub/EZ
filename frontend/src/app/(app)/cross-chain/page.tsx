'use client';

import { useState } from 'react';
import { Layers, Plus, Users, Send, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface Payment {
    id: string;
    recipient: string;
    amount: string;
    destinationChain: string;
}

export default function CrossChainPage() {
    const [mode, setMode] = useState<'single' | 'multi'>('single');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [destinationChain, setDestinationChain] = useState('ethereum');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const chains = [
        { id: 'ethereum', name: 'Ethereum' },
        { id: 'arbitrum', name: 'Arbitrum' },
        { id: 'optimism', name: 'Optimism' },
        { id: 'base', name: 'Base' },
        { id: 'polygon', name: 'Polygon' },
    ];

    const addPayment = () => {
        if (!recipient || !amount) return;
        setPayments([
            ...payments,
            {
                id: Date.now().toString(),
                recipient,
                amount,
                destinationChain,
            },
        ]);
        setRecipient('');
        setAmount('');
    };

    const removePayment = (id: string) => {
        setPayments(payments.filter((p) => p.id !== id));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        // Simulate payment
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Cross-Chain Payments</h1>
                </div>
                <p className="text-gray-600">Send payments across different blockchains</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setMode('single')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'single'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <Send className="w-4 h-4" />
                    Single Payment
                </button>
                <button
                    onClick={() => setMode('multi')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'multi'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Multi Payment
                </button>
            </div>

            {/* Payment Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="grid md:grid-cols-3 gap-4 mb-4">
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

                {mode === 'multi' && (
                    <button
                        onClick={addPayment}
                        className="flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add to batch
                    </button>
                )}
            </div>

            {/* Multi-Payment List */}
            {mode === 'multi' && payments.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Batch Payments ({payments.length})</h3>
                    <div className="space-y-3">
                        {payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-mono text-gray-600">
                                        {payment.recipient.slice(0, 10)}...
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {payment.amount} USDC
                                    </span>
                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                        {payment.destinationChain}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removePayment(payment.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={isLoading || (mode === 'single' ? !recipient || !amount : payments.length === 0)}
                className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                    </>
                ) : status === 'success' ? (
                    <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Payment Sent!
                    </>
                ) : (
                    <>
                        <Send className="w-5 h-5 mr-2" />
                        {mode === 'single' ? 'Send Payment' : `Send ${payments.length} Payments`}
                    </>
                )}
            </button>
        </div>
    );
}
