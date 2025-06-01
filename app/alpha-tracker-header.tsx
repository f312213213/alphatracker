"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, XIcon, ClockIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useAlphaData } from "./hooks/useAlphaData";
import { useRecentSearches } from "./hooks/useRecentSearches";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

// Helper function to truncate address for display
function truncateAddress(address: string, front = 6, back = 4) {
  if (!address) return "";
  if (address.length <= front + back) return address;
  return `${address.slice(0, front)}...${address.slice(-back)}`;
}

export default function AlphaTrackerHeader() {
  const [address, setAddress] = useQueryState('address');
  const { trigger, isLoading, isValidAddress, data } = useAlphaData();
  // const { recentSearches, addRecentSearch, clearRecentSearches, removeRecentSearch } = useRecentSearches();

  const handleSearch = async () => {
    if (address && isValidAddress) {
      await trigger();
    }
  };

  const handleBadgeClick = async (searchAddress: string) => {
    if (searchAddress === address || isLoading) {
      return
    }
    setAddress(searchAddress);
    // Trigger search automatically when badge is clicked
    // We need to wait for the address to be set in the URL state
    setTimeout(async () => {
      await trigger();
    }, 100);
  };

  // const handleRemoveRecentSearch = (searchAddress: string, e: React.MouseEvent) => {

  //   e.stopPropagation(); // Prevent badge click
  //   removeRecentSearch(searchAddress);
  // };

  // // Add successful searches to recent searches
  // useEffect(() => {
  //   if (data && address && isValidAddress) {
  //     addRecentSearch(address);
  //   }
  // }, [data, address, isValidAddress, addRecentSearch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl xs:text-2xl sm:text-4xl font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="h-8 w-8">
            <path d="M17.0234 13.7824V16.4128C16.5737 16.5477 16.0117 16.6601 15.1799 16.6601C13.6061 16.6601 12.6169 16.1205 12.1673 14.9065C11.2905 15.9631 10.0315 16.75 8.16547 16.75C5.17536 16.75 2.5 14.5468 2.5 10.5225V10.4775C2.5 6.45324 5.1304 4.25 7.98561 4.25C9.80666 4.25 10.9308 5.08183 11.7401 6.04856V4.47482H15.1574V12.6133C15.1574 13.5351 15.5845 13.8498 16.3264 13.8498C16.5962 13.8498 16.8435 13.8273 17.0234 13.7824ZM8.86241 13.8498C10.4586 13.8498 11.7851 12.5234 11.7851 10.5225V10.4775C11.7851 8.47662 10.4586 7.15018 8.86241 7.15018C7.26619 7.15018 5.91727 8.45414 5.91727 10.4775V10.5225C5.91727 12.5234 7.26619 13.8498 8.86241 13.8498Z" fill="currentColor" />
            <path d="M17.5 0L20 2.5L17.5 5L15 2.5L17.5 0Z" fill="#F0B90B" />
          </svg>
          Binance Alpha Tracker
        </CardTitle>
        <CardDescription>
          Track your alpha points progress. Only available for Binance keyless wallet swapping token on BSC.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2 flex-col sm:flex-row">
          <div className="flex-1">
            <Input
              className={`disabled:opacity-50 ${address && !isValidAddress ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              type="text"
              disabled={isLoading}
              placeholder="Enter your Binance wallet address"
              value={address || ""}
              onChange={(e) => setAddress(e.target.value)}
            />
            {address && !isValidAddress && (
              <p className="text-sm text-red-500 mt-1">
                Please enter a valid Ethereum wallet address (0x followed by 40 hexadecimal characters)
              </p>
            )}
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading || !isValidAddress}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            ) : (
              <SearchIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Recent Searches */}
        {/* {recentSearches.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClockIcon className="h-4 w-4" />
                Recent Searches
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="text-xs h-auto p-1 text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((searchAddress) => (
                <Badge
                  key={searchAddress}
                  variant="outline"
                  className={cn("cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1 pr-1", {
                    "cursor-not-allowed opacity-50": searchAddress === address || isLoading
                  })}
                  onClick={() => handleBadgeClick(searchAddress)}
                >
                  <span>{truncateAddress(searchAddress)}</span>
                  <button
                    onClick={(e) => handleRemoveRecentSearch(searchAddress, e)}
                    className="ml-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5 transition-colors"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
}
