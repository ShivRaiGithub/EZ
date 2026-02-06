'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, CheckCircle2, HelpCircle, Sparkles } from 'lucide-react';

export function PreferencesHelper() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const textRecords = [
        {
            key: 'payment.chain',
            value: 'optimism',
            description: 'Your preferred blockchain for receiving payments',
        },
        {
            key: 'payment.token',
            value: 'USDC',
            description: 'Your preferred token for receiving payments',
        },
        {
            key: 'payment.address',
            value: '0x... (optional)',
            description: 'Override address (uses ENS resolved address by default)',
        },
    ];

    const supportedChains = ['ethereum', 'optimism', 'arbitrum', 'base', 'polygon'];
    const supportedTokens = ['ETH', 'USDC', 'USDT', 'DAI'];

    return (
        <div className="card-glass rounded-2xl overflow-hidden">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Set Up Your Payment Preferences</h3>
                        <p className="text-sm text-gray-600">Learn how to configure your ENS for receiving payments</p>
                    </div>
                </div>
                <div className="p-2 rounded-lg bg-gray-100">
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="px-6 pb-6 space-y-6 border-t border-gray-200">
                    {/* Info Banner */}
                    <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-indigo-800">One-Time Setup</p>
                                <p className="text-sm text-indigo-700 mt-1">
                                    Set these text records in your ENS profile once, and anyone can pay you
                                    on your preferred chain automatically!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step by Step Guide */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">How to set up:</h4>
                        <ol className="space-y-3 text-gray-700">
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center">
                                    1
                                </span>
                                <span>Go to <a href="https://app.ens.domains" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">app.ens.domains</a> and connect your wallet</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center">
                                    2
                                </span>
                                <span>Click on your ENS name to open its profile</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center">
                                    3
                                </span>
                                <span>Go to the &quot;Records&quot; tab and click &quot;Edit Records&quot;</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center">
                                    4
                                </span>
                                <span>Add the following text records:</span>
                            </li>
                        </ol>
                    </div>

                    {/* Text Records */}
                    <div className="space-y-3">
                        {textRecords.map((record) => (
                            <div
                                key={record.key}
                                className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <code className="text-sm font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                                        {record.key}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(record.key, record.key)}
                                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="Copy key"
                                    >
                                        {copiedKey === record.key ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-500" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600">{record.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Example value: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">{record.value}</code>
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Supported Options */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-xl border border-gray-200">
                            <p className="font-medium text-gray-900 mb-2">Supported Chains</p>
                            <div className="flex flex-wrap gap-2">
                                {supportedChains.map((chain) => (
                                    <span
                                        key={chain}
                                        className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full border border-indigo-200"
                                    >
                                        {chain}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-200">
                            <p className="font-medium text-gray-900 mb-2">Supported Tokens</p>
                            <div className="flex flex-wrap gap-2">
                                {supportedTokens.map((token) => (
                                    <span
                                        key={token}
                                        className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full border border-purple-200"
                                    >
                                        {token}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
