'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import {
  Zap,
  Layers,
  RefreshCw,
  Search,
  User,
  Home,
  FileText
} from 'lucide-react';

const navItems = [
  { href: '/cross-chain', label: 'Cross-Chain', icon: Layers },
  { href: '/arc', label: 'Arc Testnet', icon: Zap },
  { href: '/autopay', label: 'Auto Pay', icon: RefreshCw },
  { href: '/ens', label: 'ENS Lookup', icon: Search },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 min-h-screen flex flex-col fixed left-0 top-0"
      style={{
        background: 'var(--card-bg)',
        borderRight: '1px solid var(--border-color)'
      }}
    >
      {/* Logo */}
      <div className="px-2 py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Link href="/" className="flex items-center justify-center">
          <Logo width={120} height={40} />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: isActive ? '#8b5cf6' : 'var(--text-secondary)',
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: isActive ? '#8b5cf6' : 'var(--text-muted)' }}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-4 mx-3" style={{ borderTop: '1px solid var(--border-color)' }}></div>

        {/* Secondary Links */}
        <ul className="space-y-1 px-3">
          <li>
            <Link
              href="/"
              className="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Home className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              Home
            </Link>
          </li>
          <li>
            <a
              href="https://docs.arc.network"
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <FileText className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              Docs
            </a>
          </li>
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          Arc Testnet
        </div>
      </div>
    </aside>
  );
}
