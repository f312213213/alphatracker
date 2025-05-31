"use client";

import { useBlockCacheExpiry } from "../hooks/useBlockCacheExpiry";

interface ClientCacheManagerProps {
    children: React.ReactNode;
}

export function ClientCacheManager({ children }: ClientCacheManagerProps) {
    useBlockCacheExpiry();

    return <>{children}</>;
} 