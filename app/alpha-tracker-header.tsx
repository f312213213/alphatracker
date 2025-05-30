"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useAlphaData } from "./hooks/useAlphaData";

export default function AlphaTrackerHeader() {
  const [address, setAddress] = useQueryState('address');
  const { trigger, isLoading } = useAlphaData();

  const handleSearch = async () => {
    if (address) {
      await trigger();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-4xl font-bold">Binance Alpha Tracker</CardTitle>
        <CardDescription>
          Track your alpha points progress
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2 flex-col sm:flex-row">
          <Input
            className="disabled:opacity-50"
            type="text"
            disabled={isLoading}
            placeholder="Enter your Binance wallet address"
            value={address || ""}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            ) : (
              <SearchIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
