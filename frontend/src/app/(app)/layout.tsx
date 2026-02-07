'use client';

import { Sidebar } from '@/components/Sidebar';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-secondary)' }}>
            <Sidebar />

            {/* Main Content Area */}
            <div className="ml-56">
                {/* Top Header */}
                <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <ConnectButton showBalance={false} />
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
