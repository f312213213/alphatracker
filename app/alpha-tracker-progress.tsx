"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Repeat, SearchIcon } from "lucide-react";
import { useState } from "react";
import { useQueryState } from "nuqs";

const walletAddress = "0x7447...9749";
const transactionAmount = 17010.92;
const points = 14;
const profit = -264.67;
const mileage = 16384;
const progressValue = 17010.92;
const progressMax = 32768;

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
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-4 flex-col items-start">
          <div className="text-xl font-bold text-white dark:text-white">Wallet</div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm font-mono">{walletAddress}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0"><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0"><ExternalLink className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mb-4">
          {/* 交易额 */}
          <div className="flex flex-col min-w-[90px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              交易额 <Badge className="bg-muted text-xs px-1.5 py-0.5">2x</Badge>
            </div>
            <div className="text-lg font-semibold text-white dark:text-white mt-1">${transactionAmount.toLocaleString()}</div>
          </div>
          {/* 积分 */}
          <div className="flex flex-col min-w-[60px]">
            <div className="text-sm text-muted-foreground">积分</div>
            <div className="text-lg font-semibold text-white dark:text-white mt-1">{points}</div>
          </div>
          {/* 利润 */}
          <div className="flex flex-col min-w-[80px]">
            <div className="text-sm text-muted-foreground">利润</div>
            <div className="text-lg font-semibold mt-1 text-red-500">${profit.toLocaleString()}</div>
          </div>
        </div>
        <div >
          <div className="flex justify-between text-muted-foreground mb-1">
            <span>${mileage.toLocaleString()}</span>
            <span>${progressValue.toLocaleString()} / ${progressMax.toLocaleString()}</span>
          </div>
          <Progress value={progressValue / progressMax * 100} className="h-2 bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
