class RateLimiter {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;
    private lastRequestTime = 0;
    private minInterval: number;

    constructor(requestsPerSecond: number = 5) {
        // Add small buffer to be safe (use 4 RPS instead of 5)
        this.minInterval = 1000 / (requestsPerSecond - 1);
    }

    async execute<T>(requestFn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await requestFn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });

            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    private async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;

            if (timeSinceLastRequest < this.minInterval) {
                const waitTime = this.minInterval - timeSinceLastRequest;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            const requestFn = this.queue.shift();
            if (requestFn) {
                this.lastRequestTime = Date.now();
                await requestFn();
            }
        }

        this.processing = false;
    }
}

// Create a singleton instance
export const etherscanRateLimiter = new RateLimiter(4); // Use 4 RPS to be safe 