'use client';

import { useState } from 'react';
import { useENSPaymentPreferences, useENSAddress } from '@/hooks/useENS';
import { useArcQuote, useArcExecution, getChainIdFromName, getTokenAddress } from '@/hooks/useArc';
import { CHAIN_NAMES, SUPPORTED_TOKENS, CHAIN_COLORS } from '@/lib/wagmi';
import { shortenAddress } from '@/lib/utils';
import {
    Loader2,
    CheckCircle2,
    AlertCircle,
    Wallet,
    Send,
    Zap,
    ArrowDownUp
} from 'lucide-react';

export function PaymentForm() {
    const [isConnected, setIsConnected] = useState(false);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedToken, setSelectedToken] = useState('ETH');
    const [selectedChainId] = useState(1);

    const isENS = recipient.endsWith('.eth');
    const { preferences, isLoading: ensLoading, error: ensError } = useENSPaymentPreferences(
        isENS ? recipient : undefined
    );
    const { address: recipientAddress } = useENSAddress(isENS ? recipient : undefined);

    const { quote, getQuote, isLoading: quoteLoading, setQuote } = useArcQuote();
    const { executePayment, status, txHash, error: execError, reset } = useArcExecution();
    const [error, setError] = useState<string | null>(null);

    const currentChainTokens = SUPPORTED_TOKENS[selectedChainId] || [];

    const handleGetQuote = async () => {
        if (!amount || !preferences || !recipientAddress) return;

        const toChainId = getChainIdFromName(preferences.chain);
        if (!toChainId) {
            setError(`Unsupported chain: ${preferences.chain}`);
            return;
        }
        
        setError(null);

        const fromTokenAddress = getTokenAddress(selectedChainId, selectedToken);
        const toTokenAddress = getTokenAddress(toChainId, preferences.token);

        try {
            const amountInWei = (parseFloat(amount) * 1e18).toString();
            await getQuote({
                fromChainId: selectedChainId,
                toChainId,
                fromTokenAddress,
                toTokenAddress,
                fromAmount: amountInWei,
                fromAddress: '0x1234567890123456789012345678901234567890',
                toAddress: preferences.address || recipientAddress,
            });
        } catch (err) {
            console.error('Failed to get quote:', err);
        }
    };

    const handlePay = async () => {
        if (!quote) return;
        try {
            await executePayment();
        } catch (err) {
            console.error('Payment failed:', err);
        }
    };

    const handleReset = () => {
        setAmount('');
        setQuote(null);
        setError(null);
        reset();
    };

    const handleConnect = () => {
        setIsConnected(true);
    };

    if (!isConnected) {
        return (
            <div className="card-glass p-8 rounded-2xl text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Wallet className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600 mb-6">Connect your wallet to start making cross-chain payments</p>
                <button onClick={handleConnect} className="btn-primary px-8 py-3">
                    Connect Wallet (Demo)
                </button>
            </div>
        );
    }

    return (
        <div className="card-glass p-6 md:p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Send className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Send Payment</h2>
                    <p className="text-gray-600">Pay anyone on their preferred chain</p>
                </div>
            </div>

            {/* Error Notification */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Recipient Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient (ENS name)
                </label>
                <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="vitalik.eth"
                    className="input-field w-full"
                />

                {ensLoading && (
                    <div className="mt-3 flex items-center gap-2 text-gray-500 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading payment preferences...
                    </div>
                )}

                {ensError && (
                    <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {ensError}
                    </div>
                )}

                {preferences && (
                    <div className="mt-4 preference-found">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-700">Payment Preferences Found</span>
                        </div>
                        <p className="text-gray-700 text-sm">
                            Will receive <span className="font-semibold text-gray-900">{preferences.token}</span> on{' '}
                            <span className="font-semibold text-gray-900 capitalize">{preferences.chain}</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Amount Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                </label>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            className="input-field w-full"
                        />
                    </div>
                    <select
                        value={selectedToken}
                        onChange={(e) => setSelectedToken(e.target.value)}
                        className="input-field min-w-[100px]"
                    >
                        {currentChainTokens.map((token) => (
                            <option key={token.symbol} value={token.symbol}>
                                {token.symbol}
                            </option>
                        ))}
                    </select>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    Balance: 1.5000 ETH (Demo)
                </p>
            </div>

            {/* Current Chain Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl flex items-center gap-3 border border-gray-200">
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CHAIN_COLORS[selectedChainId] || '#627EEA' }}
                />
                <span className="text-gray-600 text-sm">
                    Sending from: <span className="font-semibold text-gray-900">{CHAIN_NAMES[selectedChainId]}</span>
                </span>
            </div>

            {/* Quote Display */}
            {quote && (
                <div className="mb-6 quote-box">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-gray-900">Quote Details</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">You send:</span>
                            <span className="font-semibold text-gray-900">
                                {amount} {selectedToken}
                            </span>
                        </div>

                        <div className="flex justify-center">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <ArrowDownUp className="w-5 h-5 text-indigo-600" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">They receive:</span>
                            <span className="font-semibold text-gray-900">
                                ~{amount} {preferences?.token}
                            </span>
                        </div>

                        <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-gray-600">Est. gas cost:</span>
                            <span className="font-semibold text-gray-900">
                                ${quote.estimatedGas}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
                {!quote ? (
                    <button
                        onClick={handleGetQuote}
                        disabled={!preferences || !amount || quoteLoading || ensLoading}
                        className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {quoteLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Getting Quote...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5 mr-2" />
                                Get Quote
                            </>
                        )}
                    </button>
                ) : status === 'idle' ? (
                    <button
                        onClick={handlePay}
                        className="w-full btn-success py-4 text-lg"
                    >
                        <Send className="w-5 h-5 mr-2" />
                        Confirm & Send Payment
                    </button>
                ) : status === 'success' ? (
                    <div className="space-y-3">
                        <div className="success-box flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-green-700">Payment Successful!</p>
                                {txHash && (
                                    <p className="text-sm text-green-600 mt-1 font-mono">
                                        Tx: {shortenAddress(txHash, 8)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleReset}
                            className="w-full btn-secondary py-3"
                        >
                            Send Another Payment
                        </button>
                    </div>
                ) : (
                    <button
                        disabled
                        className="w-full btn-primary py-4 text-lg opacity-70 cursor-not-allowed"
                    >
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {status === 'approving' ? 'Approving...' : 'Processing Payment...'}
                    </button>
                )}
            </div>

            {/* Error Display */}
            {execError && (
                <div className="mt-4 error-box flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{execError}</p>
                </div>
            )}
        </div>
    );
}
