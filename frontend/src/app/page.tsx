'use client';

import Link from 'next/link';
import { PaymentForm } from "@/components/PaymentForm";
import { ENSLookup } from "@/components/ENSLookup";
import { PreferencesHelper } from "@/components/PreferencesHelper";
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
  Timer
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
              <span className="text-sm text-indigo-600 font-medium">Powered by Arc + ENS</span>
            </div>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900">
              Pay anyone on
              <br />
              <span className="logo-gradient">their preferred chain</span>
            </h2>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Simply enter an ENS name. We automatically route your payment to their
              preferred chain and token using Arc&apos;s economic infrastructure.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="#payment" className="btn-primary text-lg px-8 py-4">
                <Send className="w-5 h-5 mr-2" />
                Start Paying
              </a>
              <a href="#lookup" className="btn-secondary text-lg px-8 py-4">
                <Search className="w-5 h-5 mr-2" />
                Lookup ENS
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              Seamless payments made simple
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="feature-card">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Receiver Sets Preferences
              </h4>
              <p className="text-gray-600">
                Set your preferred chain and token in your ENS profile using text records.
                One-time setup, works forever.
              </p>
            </div>

            <div className="feature-card">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Sender Pays Easily
              </h4>
              <p className="text-gray-600">
                Pay with USDC on Arc. Stablecoin-native gas means predictable,
                low-cost transactions.
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
                Arc delivers sub-second finality. Your payment settles instantly
                with enterprise-grade reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Arc Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              The Economic OS for the internet
            </h3>
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
              <p className="text-2xl font-bold text-gray-900">Private</p>
              <p className="text-gray-600 mt-2">Opt-in configurable privacy for compliance</p>
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
            Connected via CCTP and Gateway for global liquidity
          </p>
        </div>
      </section>

      {/* Main App Section */}
      <section id="payment" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              Ready to pay?
            </h3>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <PaymentForm />
            <div id="lookup">
              <ENSLookup />
            </div>
          </div>
        </div>
      </section>

      {/* Preferences Helper */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <PreferencesHelper />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="feature-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Globe2 className="w-6 h-6 text-indigo-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">Powered by ENS</h4>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                  Decentralized payment preferences
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                  Human-readable addresses
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                  User-controlled settings
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                  No centralized database needed
                </li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">Powered by Arc</h4>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                  USDC-native gas fees
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                  Sub-second finality
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                  Enterprise-grade reliability
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                  Global liquidity via CCTP
                </li>
              </ul>
            </div>
          </div>

          {/* Additional Features Row */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
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

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold logo-gradient">EZ</span>
          </div>
          <p className="text-gray-600 mb-2">
            Built on Arc + ENS 🚀
          </p>
          <p className="text-sm text-gray-500">
            The Economic OS for seamless crypto payments
          </p>
        </div>
      </footer>
    </div>
  );
}
