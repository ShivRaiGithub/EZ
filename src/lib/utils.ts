import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTokenAmount(amount: string, decimals: number, displayDecimals = 4): string {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    return value.toFixed(displayDecimals);
}
