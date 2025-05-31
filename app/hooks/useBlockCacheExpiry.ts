import { useEffect } from 'react';
import { BlockCache } from '../utils/blockCache';

export function useBlockCacheExpiry() {
    useEffect(() => {
        // Clear expired cache on mount
        BlockCache.clearExpiredCache();

        const getCurrentUtcDay = () => new Date().toISOString().split('T')[0];
        let currentUtcDay = getCurrentUtcDay();

        // Check for UTC day change every minute
        const interval = setInterval(() => {
            const newUtcDay = getCurrentUtcDay();
            if (newUtcDay !== currentUtcDay) {
                console.log('UTC day changed, clearing block cache');
                BlockCache.clearExpiredCache();
                currentUtcDay = newUtcDay;
            }
        }, 60000); // Check every minute

        // Also check when page becomes visible again (user returns to tab)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                const newUtcDay = getCurrentUtcDay();
                if (newUtcDay !== currentUtcDay) {
                    console.log('UTC day changed (visibility), clearing block cache');
                    BlockCache.clearExpiredCache();
                    currentUtcDay = newUtcDay;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
} 