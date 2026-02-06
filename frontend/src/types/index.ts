export interface PaymentPreferences {
    chain: string;
    token: string;
    address?: string;
}

export interface PaymentQuote {
    fromChain: number;
    toChain: number;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    estimatedGas: string;
    route: any;
}

export interface PaymentState {
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    txHash?: string;
}

export interface ENSProfile {
    address: string | null;
    ensName: string;
    avatar?: string | null;
    preferences?: PaymentPreferences | null;
    records?: Record<string, string | null>;
}

export interface TokenInfo {
    symbol: string;
    address: string;
    decimals: number;
    logoURI?: string;
}
