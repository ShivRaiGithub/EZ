'use client';

import { useState } from 'react';
import { Zap, Plus, Users, Send, Loader2, CheckCircle2, Trash2, CircleDollarSign } from 'lucide-react';

interface Payment {
    id: string;
    recipient: string;
    amount: string;
}

export default function ArcPage() {
    const [mode, setMode] = useState<'single' | 'multi'>('single');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const addPayment = () => {
        if (!recipient || !amount) return;
        setPayments([
            ...payments,
            {
                id: Date.now().toString(),
                recipient,
                amount,
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
        // Simulate payment with sub-second finality
        await new Promise((resolve) => setTimeout(resolve, 800));
        setIsLoading(false);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Arc Testnet</h1>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Testnet Active
                    </span>
                </div>
                <p className="text-gray-600">Make payments on Arc with USDC gas fees and instant finality</p>
            </div>

            {/* Arc Info Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-center gap-4">
                <CircleDollarSign className="w-8 h-8 text-purple-600" />
                <div>
                    <p className="font-medium text-purple-900">USDC-Native Gas</p>
                    <p className="text-sm text-purple-700">Gas fees are paid in USDC, not volatile tokens. Estimated: ~$0.01</p>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setMode('single')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'single'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <Send className="w-4 h-4" />
                    Single Payment
                </button>
                <button
                    onClick={() => setMode('multi')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'multi'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Multi Payment
                </button>
            </div>

            {/* Payment Form */}
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
                </div>

                <p className="text-xs text-gray-500 mb-4">
                    All payments on Arc settle with sub-second finality on Arc Testnet
                </p>

                {mode === 'multi' && (
                    <button
                        onClick={addPayment}
                        className="flex items-center gap-2 text-purple-600 text-sm font-medium hover:text-purple-700"
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
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
                        <span className="text-gray-600">Total</span>
                        <span className="font-semibold text-gray-900">
                            {payments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0).toFixed(2)} USDC
                        </span>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={isLoading || (mode === 'single' ? !recipient || !amount : payments.length === 0)}
                className="w-full py-4 text-lg font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center"
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
                        <Zap className="w-5 h-5 mr-2" />
                        {mode === 'single' ? 'Send on Arc' : `Send ${payments.length} Payments`}
                    </>
                )}
            </button>
        </div>
    );
}
