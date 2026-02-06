'use client';

import { Sidebar } from '@/components/Sidebar';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
                    <ConnectButton showBalance={false} />
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
