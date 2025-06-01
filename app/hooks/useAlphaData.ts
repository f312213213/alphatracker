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

    const tokenMap = swrData?.transactions?.reduce((acc: any, tx: any) => {
        // Handle incoming tokens (to)
        if (tx.to.symbol) {
            if (!acc[tx.to.symbol]) {
                acc[tx.to.symbol] = { incoming: 0, outgoing: 0, address: tx.to.address, profit: 0 };
            }
            acc[tx.to.symbol].incoming += tx.to.value;
            acc[tx.to.symbol].profit += tx.to.value * swrData.price[tx.to.symbol];
        }

        // Handle outgoing tokens (from)
        if (tx.from.symbol) {
            if (!acc[tx.from.symbol]) {
                acc[tx.from.symbol] = { incoming: 0, outgoing: 0, address: tx.from.address, profit: 0 };
            }
            acc[tx.from.symbol].outgoing += tx.from.value;
            acc[tx.from.symbol].profit -= tx.from.value * swrData.price[tx.from.symbol];
        }
        return acc;
    }, {});

    const tokenList = Object.keys(tokenMap ?? {}).sort((a, b) => {
        const profitA = tokenMap[a].profit;
        const profitB = tokenMap[b].profit;

        // First sort by positive profits
        if (profitA > 0 && profitB <= 0) return -1;
        if (profitA <= 0 && profitB > 0) return 1;

        // Then sort by negative profits
        if (profitA < 0 && profitB >= 0) return -1;
        if (profitA >= 0 && profitB < 0) return 1;

        // Finally sort by absolute profit value
        return Math.abs(profitB) - Math.abs(profitA);
    });

    return {
        data: swrData,
        tokenList: tokenList,
        tokenMap: tokenMap,
        error: swrError,
        isLoading: isLoading || isValidating,
        trigger: () => address && validateAddress(address) ? mutate(address) : null,
        isValidAddress: address ? validateAddress(address) : false,
    };
} 