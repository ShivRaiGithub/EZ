'use client';

import { Sidebar } from '@/components/Sidebar';
import { Wallet } from 'lucide-react';
import { useState } from 'react';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isConnected, setIsConnected] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            {/* Main Content Area */}
            <div className="ml-56">
                {/* Top Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                    </div>
                    <button
                        onClick={() => setIsConnected(!isConnected)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isConnected
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                    >
                        <Wallet className="w-4 h-4" />
                        {isConnected ? '0x1234...5678' : 'Connect Wallet'}
                    </button>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
