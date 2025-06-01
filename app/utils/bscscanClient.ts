interface BscscanResponse<T = any> {
    status: string;
    message: string;
    result: T;
}

interface RetryOptions {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

interface ApiCallOptions extends RetryOptions {
    validateResult?: (result: any) => boolean;
    logErrors?: boolean;
}

class BscscanClient {
    private defaultRetryOptions: RetryOptions = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
    };

    private circuitBreaker = {
        failureCount: 0,
        lastFailureTime: 0,
        threshold: 5,
        resetTimeoutMs: 60000, // 1 minute
        isOpen: false
    };

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private calculateBackoffDelay(attempt: number, options: RetryOptions): number {
        const exponentialDelay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt);
        const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
        return Math.min(jitteredDelay, options.maxDelay);
    }

    private isCircuitBreakerOpen(): boolean {
        if (!this.circuitBreaker.isOpen) return false;

        const now = Date.now();
        if (now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.resetTimeoutMs) {
            this.circuitBreaker.isOpen = false;
            this.circuitBreaker.failureCount = 0;
            return false;
        }

        return true;
    }

    private recordFailure(): void {
        this.circuitBreaker.failureCount++;
        this.circuitBreaker.lastFailureTime = Date.now();

        if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
            this.circuitBreaker.isOpen = true;
            console.warn(`BSCSCAN Circuit breaker opened due to ${this.circuitBreaker.failureCount} failures`);
        }
    }

    private recordSuccess(): void {
        this.circuitBreaker.failureCount = 0;
        this.circuitBreaker.isOpen = false;
    }

    private validateResponse<T>(response: BscscanResponse<T>, customValidator?: (result: T) => boolean): boolean {
        // Check if response is successful
        if (response.status !== "1") {
            console.warn(`BSCSCAN API returned non-success status: ${response.status}, message: ${response.message}`);
            return false;
        }

        // Check if result exists
        if (response.result === null || response.result === undefined) {
            console.warn('BSCSCAN API returned null/undefined result');
            return false;
        }

        // For array results, check if empty when data is expected
        if (Array.isArray(response.result) && response.result.length === 0) {
            console.warn('BSCSCAN API returned empty array - this might indicate missing data');
            // We'll allow empty arrays but log them for monitoring
        }

        // Run custom validation if provided
        if (customValidator && !customValidator(response.result)) {
            console.warn('BSCSCAN API response failed custom validation');
            return false;
        }

        return true;
    }

    async makeApiCall<T>(
        url: URL,
        options: Partial<ApiCallOptions> = {}
    ): Promise<BscscanResponse<T>> {
        const mergedOptions = { ...this.defaultRetryOptions, ...options };

        // Check circuit breaker
        if (this.isCircuitBreakerOpen()) {
            throw new Error('BSCSCAN API circuit breaker is open - too many recent failures');
        }

        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= mergedOptions.maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = this.calculateBackoffDelay(attempt - 1, mergedOptions);
                    console.log(`BSCSCAN retry attempt ${attempt} after ${delay}ms delay`);
                    await this.delay(delay);
                }

                console.log(`BSCSCAN API call attempt ${attempt + 1}:`, url.toString());

                const response = await fetch(url.toString());

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data: BscscanResponse<T> = await response.json();

                // Validate the response
                if (!this.validateResponse(data, options.validateResult)) {
                    // If it's the last attempt, log the invalid response but return it
                    // This allows the caller to handle empty results appropriately
                    if (attempt === mergedOptions.maxRetries) {
                        console.warn('BSCSCAN API returned invalid response on final attempt:', {
                            status: data.status,
                            message: data.message,
                            resultType: Array.isArray(data.result) ? 'array' : typeof data.result,
                            resultLength: Array.isArray(data.result) ? data.result.length : 'N/A'
                        });
                        this.recordSuccess(); // Don't penalize for empty results
                        return data;
                    }

                    throw new Error(`Invalid response: status=${data.status}, message=${data.message}`);
                }

                this.recordSuccess();
                console.log(`BSCSCAN API call successful on attempt ${attempt + 1}`);
                return data;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (options.logErrors !== false) {
                    console.error(`BSCSCAN API call failed on attempt ${attempt + 1}:`, lastError.message);
                }

                // Don't retry on certain errors
                if (lastError.message.includes('404') || lastError.message.includes('403')) {
                    break;
                }
            }
        }

        this.recordFailure();
        throw new Error(`BSCSCAN API call failed after ${mergedOptions.maxRetries + 1} attempts. Last error: ${lastError?.message}`);
    }

    // Specific method for transaction list calls
    async getTransactionList(params: {
        address: string;
        startblock: string;
        endblock?: string;
        apikey: string;
        action: 'txlist' | 'txlistinternal' | 'tokentx';
        page?: string;
        offset?: string;
        sort?: 'asc' | 'desc';
    }): Promise<BscscanResponse<any[]>> {
        const url = new URL("https://api.etherscan.io/v2/api");
        url.searchParams.set("chainid", "56");
        url.searchParams.set("module", "account");
        url.searchParams.set("action", params.action);
        url.searchParams.set("address", params.address);
        url.searchParams.set("startblock", params.startblock);
        url.searchParams.set("endblock", params.endblock || "99999999");
        url.searchParams.set("page", params.page || "1");
        url.searchParams.set("offset", params.offset || "10000");
        url.searchParams.set("sort", params.sort || "desc");
        url.searchParams.set("apikey", params.apikey);

        return this.makeApiCall<any[]>(url, {
            maxRetries: 4, // Extra retries for transaction data
            validateResult: (result) => {
                // For transaction calls, we expect an array
                if (!Array.isArray(result)) {
                    console.warn(`Expected array for ${params.action} but got:`, typeof result);
                    return false;
                }
                return true;
            }
        });
    }

    // Method to get block number with validation
    async getBlockNumber(timestamp: number, apikey: string): Promise<BscscanResponse<string>> {
        const url = new URL("https://api.etherscan.io/v2/api");
        url.searchParams.set("chainid", "56");
        url.searchParams.set("module", "block");
        url.searchParams.set("action", "getblocknobytime");
        url.searchParams.set("timestamp", timestamp.toString());
        url.searchParams.set("closest", "before");
        url.searchParams.set("apikey", apikey);

        return this.makeApiCall<string>(url, {
            validateResult: (result) => {
                if (typeof result !== 'string' || isNaN(parseInt(result))) {
                    console.warn('Invalid block number received:', result);
                    return false;
                }
                return true;
            }
        });
    }

    // Method to get circuit breaker status for monitoring
    getCircuitBreakerStatus() {
        return {
            isOpen: this.circuitBreaker.isOpen,
            failureCount: this.circuitBreaker.failureCount,
            lastFailureTime: this.circuitBreaker.lastFailureTime
        };
    }
}

export const bscscanClient = new BscscanClient(); 