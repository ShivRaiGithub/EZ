'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">EZ</span>
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">BETA</span>
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-4 mx-3 border-t border-gray-100"></div>

        {/* Secondary Links */}
        <ul className="space-y-1 px-3">
          <li>
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Home className="w-4 h-4 text-gray-400" />
              Home
            </Link>
          </li>
          <li>
            <a
              href="https://docs.arc.network"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              Docs
            </a>
          </li>
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          Arc Testnet
        </div>
      </div>
    </aside>
  );
}
