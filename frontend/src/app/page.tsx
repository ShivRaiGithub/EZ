'use client';

import Link from 'next/link';
import { CHAIN_LOGOS } from "@/components/ChainLogos";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import {
  Zap,
  ArrowRight,
  Globe2,
  Sparkles,
  Send,
  Search,
  Shield,
  Clock,
  DollarSign,
  CircleDollarSign,
  Lock,
  Timer,
  RefreshCw,
  Users,
  Inbox,
  User,
  Layers
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg gradient-mesh">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Logo width={120} height={36} />
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/cross-chain" className="btn-secondary px-4 py-2 text-sm">
                Launch App
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <ConnectButton showBalance={false} />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 mb-8">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-indigo-600 font-medium">Powered by Arc + Circle CCTP + ENS</span>
            </div>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">
              The Complete
              <br />
              <span className="logo-gradient">Crypto Payments Suite</span>
            </h2>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Cross-chain transfers, recurring payments, payment requests, and contacts
              all powered by Arc&apos;s USDC-native infrastructure.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/cross-chain" className="btn-primary text-lg px-8 py-4">
                <Send className="w-5 h-5 mr-2" />
                Start Paying
              </Link>
              <Link href="/ens" className="btn-secondary text-lg px-8 py-4">
                <Search className="w-5 h-5 mr-2" />
                Lookup ENS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              Everything you need for crypto payments
            </h3>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              A complete suite of payment tools built for the multi-chain future
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cross-Chain */}
            <Link href="/cross-chain" className="feature-card group cursor-pointer hover:border-indigo-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-7 h-7 text-indigo-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Cross-Chain Payments
              </h4>
              <p className="text-gray-600">
                Send USDC across Ethereum, Base, Arbitrum, Optimism, and Polygon via Circle CCTP.
              </p>
              <div className="mt-4 text-indigo-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Try it <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Auto Pay */}
            <Link href="/autopay" className="feature-card group cursor-pointer hover:border-green-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-7 h-7 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Auto Payments
              </h4>
              <p className="text-gray-600">
                Set up recurring payments with smart contract wallets. Fund, withdraw, pause anytime.
              </p>
              <div className="mt-4 text-green-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Try it <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Payment Requests */}
            <Link href="/requests" className="feature-card group cursor-pointer hover:border-purple-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Inbox className="w-7 h-7 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Payment Requests
              </h4>
              <p className="text-gray-600">
                Request payments from anyone. Accept or reject incoming requests easily.
              </p>
              <div className="mt-4 text-purple-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Try it <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Contacts */}
            <Link href="/contacts" className="feature-card group cursor-pointer hover:border-blue-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Contacts
              </h4>
              <p className="text-gray-600">
                Save frequently used addresses with friendly names for quick payments.
              </p>
              <div className="mt-4 text-blue-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Try it <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* ENS Lookup */}
            <Link href="/ens" className="feature-card group cursor-pointer hover:border-amber-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe2 className="w-7 h-7 text-amber-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                ENS Lookup
              </h4>
              <p className="text-gray-600">
                Resolve ENS names and view payment preferences set via text records.
              </p>
              <div className="mt-4 text-amber-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Try it <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Profile */}
            <Link href="/profile" className="feature-card group cursor-pointer hover:border-rose-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <User className="w-7 h-7 text-rose-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Profile & History
              </h4>
              <p className="text-gray-600">
                View balances across chains and complete transaction history with filters.
              </p>
              <div className="mt-4 text-rose-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Try it <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Arc Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              Powered by Arc — The Economic OS
            </h3>
            <p className="text-gray-600 mt-4">
              Circle&apos;s L1 blockchain designed for enterprise payments
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="stats-card">
              <div className="w-14 h-14 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <CircleDollarSign className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">USDC Gas</p>
              <p className="text-gray-600 mt-2">Pay fees in stablecoins, not volatile tokens</p>
            </div>
            <div className="stats-card">
              <div className="w-14 h-14 mx-auto rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Timer className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">Sub-Second</p>
              <p className="text-gray-600 mt-2">Deterministic finality for instant settlement</p>
            </div>
            <div className="stats-card">
              <div className="w-14 h-14 mx-auto rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">Enterprise Ready</p>
              <p className="text-gray-600 mt-2">Built for compliance and reliability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Chains */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            Connect across the ecosystem
          </h3>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {[
              { name: 'Ethereum', color: '#627EEA' },
              { name: 'Arbitrum', color: '#28A0F0' },
              { name: 'Optimism', color: '#FF0420' },
              { name: 'Base', color: '#0052FF' },
              { name: 'Polygon', color: '#8247E5' },
            ].map((chain) => {
              const LogoComponent = CHAIN_LOGOS[chain.name];
              return (
                <div key={chain.name} className="flex flex-col items-center gap-3 chain-logo-wrapper">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
                    style={{ border: `3px solid ${chain.color}` }}
                  >
                    <LogoComponent className="w-9 h-9" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{chain.name}</span>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-gray-500 text-sm">
            Connected via Circle CCTP for seamless cross-chain transfers
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              How it works
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="feature-card">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Connect Wallet
              </h4>
              <p className="text-gray-600">
                Connect your MetaMask or any Web3 wallet to get started.
              </p>
            </div>

            <div className="feature-card">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Choose Feature
              </h4>
              <p className="text-gray-600">
                Send cross-chain, set up auto payments, request money, or manage contacts.
              </p>
            </div>

            <div className="feature-card">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Instant Settlement
              </h4>
              <p className="text-gray-600">
                Payments settle with sub-second finality on Arc&apos;s enterprise infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="feature-card text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Non-custodial</h4>
              <p className="text-sm text-gray-600">You always control your funds</p>
            </div>
            <div className="feature-card text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Clock className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Instant Settlement</h4>
              <p className="text-sm text-gray-600">Deterministic finality</p>
            </div>
            <div className="feature-card text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <DollarSign className="w-7 h-7 text-amber-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Low Fees</h4>
              <p className="text-sm text-gray-600">Predictable stablecoin gas</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to simplify your crypto payments?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join the future of cross-chain payments with EZ
          </p>
          <Link href="/cross-chain" className="btn-primary text-lg px-10 py-4">
            Launch App
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Logo width={100} height={30} />
          </div>
          <p className="text-gray-600 mb-2">
            Built on Arc + Circle CCTP + ENS 🚀
          </p>
          <p className="text-sm text-gray-500">
            The complete crypto payments suite
          </p>
        </div>
      </footer>
    </div>
  );
}
