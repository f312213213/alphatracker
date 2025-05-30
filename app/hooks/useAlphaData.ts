import { useQueryState } from "nuqs";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const fetcher = (url: string, { arg }: { arg: string }) =>
    fetch(url, {
        method: "POST",
        body: JSON.stringify({ address: arg }),
    }).then((res) => res.json());

export function useAlphaData() {
    const [address] = useQueryState('address');

    // Use SWR to keep the data in sync
    const { data: swrData, error: swrError, isLoading, isValidating, mutate } = useSWR(
        address ? ['/api/calculate', address] : null,
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
        trigger: () => address ? mutate(address) : null,
    };
} 