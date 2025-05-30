"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { useQueryState } from "nuqs";


export default function AlphaTrackerHeader() {
  const [address, setAddress] = useQueryState('address')

  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        body: JSON.stringify({ address }),
      });
      const data = await response.json();
      setBalance(data.result);
    } catch (error) {
      setError(true);
    } finally {
      setLoading(false);
    }

  }

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
          <Input type="text" placeholder="Enter your Binance wallet address" value={address || ""} onChange={(e) => setAddress(e.target.value)} />
          <Button onClick={handleSearch}>
            <SearchIcon />
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
