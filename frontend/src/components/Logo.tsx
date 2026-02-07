'use client';

import Image from 'next/image';
import { useTheme } from './ThemeProvider';

interface LogoProps {
    width: number;
    height: number;
    className?: string;
}

export function Logo({ width, height, className }: LogoProps) {
    const { theme } = useTheme();

    return (
        <Image
            src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'}
            alt="EZ - Easy Payments"
            width={width}
            height={height}
            style={{ objectFit: 'contain' }}
            className={className}
        />
    );
}
