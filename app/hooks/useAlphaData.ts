import { useQueryState } from "nuqs";
import useSWR from "swr";
import { useGATracking } from "./useGATracking";
import { BlockCache } from "../utils/blockCache";

const validateAddress = (address: string): boolean => {
    // Check if address starts with 0x and has 42 characters (0x + 40 hex chars)
    if (!address.startsWith('0x') || address.length !== 42) return false;

    // Check if the rest of the address contains only hexadecimal characters
    const hexRegex = /^[0-9a-fA-F]+$/;
    return hexRegex.test(address.slice(2));
};

export function useAlphaData() {
    const [address] = useQueryState('address');
    const { trackWalletSearch } = useGATracking();

    const fetcher = async (url: string, { arg }: { arg: string }) => {
        // Track the wallet search
        trackWalletSearch(arg);

        try {
            // Get block number from cache or fetch new one
            const blockNumber = await BlockCache.getBlockNumber();

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: arg,
                    blockNumber: blockNumber
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching alpha data:', error);
            throw error;
        }
    }

    // Use SWR to keep the data in sync
    const { data: swrData, error: swrError, isLoading, isValidating, mutate } = useSWR(
        address && validateAddress(address) ? ['/api/calculate', address] : null,
        ([url, addr]) => fetcher(url, { arg: addr }),
        {
            revalidateOnFocus: false,
            errorRetryCount: 3,
            errorRetryInterval: 2000,
        }
    );

    // Clear expired cache on mount/address change
    if (typeof window !== 'undefined') {
        BlockCache.clearExpiredCache();
    }

    return {
        data: swrData,
        error: swrError,
        isLoading: isLoading || isValidating,
        trigger: () => address && validateAddress(address) ? mutate(address) : null,
        isValidAddress: address ? validateAddress(address) : false,
    };
} 