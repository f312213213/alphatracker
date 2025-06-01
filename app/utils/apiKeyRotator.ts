class ApiKeyRotator {
    private keys: string[];
    private currentIndex = 0;

    constructor(keys: string[]) {
        this.keys = keys.filter(key => key && key.trim() !== '');
        if (this.keys.length === 0) {
            throw new Error('At least one API key is required');
        }
    }

    getNextKey(): string {
        const key = this.keys[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        return key;
    }

    getAllKeys(): string[] {
        return [...this.keys];
    }

    getKeyCount(): number {
        return this.keys.length;
    }
}

// Initialize with environment variables
const getApiKeys = (): string[] => {
    const keys = [];

    // Primary key
    if (process.env.ETHERSCAN_API_KEY) {
        keys.push(process.env.ETHERSCAN_API_KEY);
    }

    // Additional keys (you can add more)
    if (process.env.ETHERSCAN_API_KEY_2) {
        keys.push(process.env.ETHERSCAN_API_KEY_2);
    }

    if (process.env.ETHERSCAN_API_KEY_3) {
        keys.push(process.env.ETHERSCAN_API_KEY_3);
    }

    return keys;
};

export const etherscanApiKeyRotator = new ApiKeyRotator(getApiKeys()); 