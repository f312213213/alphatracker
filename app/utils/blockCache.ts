interface CachedBlock {
    blockNumber: string;
    timestamp: number;
    utcDay: string;
    cachedAt: number;
}

const BLOCK_CACHE_KEY = 'alpha_tracker_block_cache';

export class BlockCache {
    private static getCurrentUtcDay(): string {
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    private static getCachedBlock(): CachedBlock | null {
        try {
            const cached = localStorage.getItem(BLOCK_CACHE_KEY);
            if (!cached) return null;

            const parsedCache: CachedBlock = JSON.parse(cached);
            return parsedCache;
        } catch (error) {
            console.error('Error reading cached block:', error);
            this.clearCache();
            return null;
        }
    }

    private static setCachedBlock(blockData: CachedBlock): void {
        try {
            localStorage.setItem(BLOCK_CACHE_KEY, JSON.stringify(blockData));
        } catch (error) {
            console.error('Error setting cached block:', error);
        }
    }

    private static clearCache(): void {
        try {
            localStorage.removeItem(BLOCK_CACHE_KEY);
        } catch (error) {
            console.error('Error clearing cached block:', error);
        }
    }

    private static isExpired(cachedBlock: CachedBlock): boolean {
        const currentUtcDay = this.getCurrentUtcDay();
        return cachedBlock.utcDay !== currentUtcDay;
    }

    static async getBlockNumber(): Promise<string> {
        // Check if we have a valid cached block
        const cachedBlock = this.getCachedBlock();

        if (cachedBlock && !this.isExpired(cachedBlock)) {
            console.log('Using cached block number:', cachedBlock.blockNumber);
            return cachedBlock.blockNumber;
        }

        // Cache is expired or doesn't exist, fetch new block number
        console.log('Fetching new block number...');
        try {
            const response = await fetch('/api/block');
            if (!response.ok) {
                throw new Error(`Failed to fetch block number: ${response.statusText}`);
            }

            const blockData = await response.json();

            if (blockData.error) {
                throw new Error(blockData.error);
            }

            const newCachedBlock: CachedBlock = {
                blockNumber: blockData.blockNumber,
                timestamp: blockData.timestamp,
                utcDay: blockData.utcDay,
                cachedAt: Date.now()
            };

            this.setCachedBlock(newCachedBlock);
            console.log('Cached new block number:', newCachedBlock.blockNumber);

            return newCachedBlock.blockNumber;
        } catch (error) {
            console.error('Error fetching block number:', error);

            // If we have an expired cache but can't fetch new data, use the expired cache as fallback
            if (cachedBlock) {
                console.warn('Using expired cached block as fallback:', cachedBlock.blockNumber);
                return cachedBlock.blockNumber;
            }

            throw error;
        }
    }

    static clearExpiredCache(): void {
        const cachedBlock = this.getCachedBlock();
        if (cachedBlock && this.isExpired(cachedBlock)) {
            console.log('Clearing expired block cache');
            this.clearCache();
        }
    }

    static getCacheInfo(): CachedBlock | null {
        return this.getCachedBlock();
    }
} 