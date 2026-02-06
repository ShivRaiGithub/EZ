// Chain Logo SVG Components

export function EthereumLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#627EEA" />
            <path d="M16.498 4V12.87L23.995 16.22L16.498 4Z" fill="white" fillOpacity="0.6" />
            <path d="M16.498 4L9 16.22L16.498 12.87V4Z" fill="white" />
            <path d="M16.498 21.968V27.995L24 17.616L16.498 21.968Z" fill="white" fillOpacity="0.6" />
            <path d="M16.498 27.995V21.967L9 17.616L16.498 27.995Z" fill="white" />
            <path d="M16.498 20.573L23.995 16.22L16.498 12.872V20.573Z" fill="white" fillOpacity="0.2" />
            <path d="M9 16.22L16.498 20.573V12.872L9 16.22Z" fill="white" fillOpacity="0.6" />
        </svg>
    );
}

export function ArbitrumLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="#28A0F0" />
            <path d="M17.8 10.5L21.5 16L17.8 21.5H14.2L10.5 16L14.2 10.5H17.8Z" fill="white" />
            <path d="M16 12L19 16L16 20L13 16L16 12Z" fill="#28A0F0" />
        </svg>
    );
}

export function OptimismLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="#FF0420" />
            <path d="M10.5 20.5C8.5 20.5 7 19.5 7 17C7 14.5 8.5 12 11.5 12C14 12 15.5 13.5 15.5 16C15.5 19 13.5 20.5 10.5 20.5ZM11 14C9.5 14 9 15.5 9 17C9 18.5 9.5 19 10.5 19C12 19 13 17.5 13 16C13 14.5 12.5 14 11 14Z" fill="white" />
            <path d="M18.5 20.5V12.5H22C24 12.5 25.5 13.5 25.5 15.5C25.5 17.5 24 18.5 22 18.5H20.5V20.5H18.5ZM20.5 17H21.5C22.5 17 23 16.5 23 15.5C23 14.5 22.5 14.5 21.5 14.5H20.5V17Z" fill="white" />
        </svg>
    );
}

export function BaseLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="#0052FF" />
            <path d="M16 26C21.5228 26 26 21.5228 26 16C26 10.4772 21.5228 6 16 6C10.4772 6 6 10.4772 6 16C6 21.5228 10.4772 26 16 26Z" fill="#0052FF" />
            <path d="M16 23C19.866 23 23 19.866 23 16C23 12.134 19.866 9 16 9C12.134 9 9 12.134 9 16H16V23Z" fill="white" />
        </svg>
    );
}

export function PolygonLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="#8247E5" />
            <path d="M21.5 13.5L17.5 11L13.5 13.5V18.5L17.5 21L21.5 18.5V13.5Z" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M13.5 13.5L9.5 11L5.5 13.5V18.5L9.5 21L13.5 18.5" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M26.5 13.5L22.5 11L18.5 13.5V18.5L22.5 21L26.5 18.5V13.5Z" stroke="white" strokeWidth="1.5" fill="none" />
        </svg>
    );
}

export const CHAIN_LOGOS: Record<string, React.ComponentType<{ className?: string }>> = {
    'Ethereum': EthereumLogo,
    'Arbitrum': ArbitrumLogo,
    'Optimism': OptimismLogo,
    'Base': BaseLogo,
    'Polygon': PolygonLogo,
};
