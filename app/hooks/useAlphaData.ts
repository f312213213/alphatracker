import { useQueryState } from "nuqs";
import useSWR from "swr";
import { useGATracking } from "./useGATracking";

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

    const fetcher = (url: string, { arg }: { arg: string }) => {
        // Track the wallet search
        trackWalletSearch(arg);

        return fetch(url, {
            method: "POST",
            body: JSON.stringify({ address: arg }),
        }).then((res) => res.json())
    }

    // Use SWR to keep the data in sync
    const { data: swrData, error: swrError, isLoading, isValidating, mutate } = useSWR(
        address && validateAddress(address) ? ['/api/calculate', address] : null,
        ([url, addr]) => fetcher(url, { arg: addr }),
        {
            revalidateOnFocus: false,
        }
    );

    // Use SWRMutation for manual triggers

    return {
        data: swrData,
        error: swrError,
        isLoading: isLoading || isValidating,
        trigger: () => address && validateAddress(address) ? mutate(address) : null,
        isValidAddress: address ? validateAddress(address) : false,
    };
} 