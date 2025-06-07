"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, ExternalLink, Info, Check, X } from "lucide-react";
import { useQueryState } from "nuqs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlphaData } from "./hooks/useAlphaData";
import { calculateAlphaPoints, getNextPointsThreshold } from "./utils/calculatePoints";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

function truncateMiddle(str: string, front = 6, back = 6) {
  if (!str) return "";
  if (str.length <= front + back) return str;
  return `${str.slice(0, front)}...${str.slice(-back)}`;
}

export default function AlphaTrackerProgress() {
  const [address] = useQueryState('address');
  const { data, error, isLoading, tokenList, tokenMap } = useAlphaData();
  const [copied, setCopied] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('bscscan-alert-dismissed');
    if (dismissed === 'true') {
      setAlertDismissed(true);
    } else {
      setAlertDismissed(false);
    }
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAlertDismiss = () => {
    setAlertDismissed(true);
    localStorage.setItem('bscscan-alert-dismissed', 'true');
  };

  if (!address || !data && !isLoading) {
    return null;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="text-red-500">Failed to load data</div>
        </CardContent>
      </Card>
    );
  }

  const gasFee = data?.transactions.reduce((acc: number, token: any) => {
    return acc + (token.gas * data.price.BNB);
  }, 0);

  const profit = tokenList.reduce((acc: number, token: any) => {
    if (tokenMap[token].profit >= 0 || tokenMap[token].profit <= 0) {
      return acc + tokenMap[token].profit;
    }
    return acc;
  }, 0) - gasFee;

  const volume = (data?.volume * 2) || 0;
  const points = calculateAlphaPoints(volume);
  const nextThreshold = getNextPointsThreshold(points);
  const previousThreshold = points > 1 ? getNextPointsThreshold(points - 1) : 0;
  const progressValue = volume;
  const progressMax = nextThreshold;
  const showSkeleton = isLoading;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-col items-start">
          <div className="text-xl font-bold text-black dark:text-white">Wallet</div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm font-mono">{truncateMiddle(address)}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={handleCopy}>
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="h-4 w-4 text-green-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Copy className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            {/* <Button variant="ghost" size="icon" className="h-6 w-6 p-0"><ExternalLink className="h-4 w-4" /></Button> */}
          </div>
        </div>

        {!alertDismissed && (
          <Alert variant="warning" className="relative">
            <Info className="h-4 w-4" />
            <AlertTitle className="text-amber-800 dark:text-amber-200 font-semibold">BSCScan API is unstable</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm sm:text-base leading-relaxed">
              <p>
                We use BSCScan API to track your wallet transactions.
                <br />
                However, BSCScan is unstable and sometimes returns incorrect data.
                <br />
                This usually can be solved by retrying the search or refreshing the page.
              </p>
              <br />
              <p>
                If the problem persists, please contact us.
              </p>
            </AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-amber-200 dark:hover:bg-amber-800"
              onClick={handleAlertDismiss}
            >
              <X className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            </Button>
          </Alert>
        )}

        <div>
          {/* <div className="text-xl font-bold text-white dark:text-white">Stats</div> */}
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col min-w-[90px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Volume <Badge className="bg-muted text-xs px-1.5 py-0.5"><a href="https://www.binance.com/support/announcement/detail/37f90caac9c24988bbd9ce3595a136a2" target="_blank" rel="noopener noreferrer">2x with BSC event</a></Badge>
              </div>
              {showSkeleton ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <div className="text-lg font-semibold text-black dark:text-white mt-1">
                  ${volume?.toLocaleString()} <span className="text-xs text-muted-foreground">({data?.volume?.toLocaleString()})</span>
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-[60px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Points
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>1 point for first $2</p>
                      <p>+1 point for each doubling</p>
                      <p>Next point at ${nextThreshold.toLocaleString()}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {showSkeleton ? (
                <Skeleton className="h-7 w-12 mt-1" />
              ) : (
                <div className="text-lg font-semibold text-black dark:text-white mt-1">
                  {points}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-[80px]">
              <div className="text-sm text-muted-foreground">Profit (slippage + gas)</div>
              {showSkeleton ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <div className={cn("text-lg font-semibold mt-1", {
                  "text-red-500": profit < 0,
                  "text-green-500": profit > 0,
                  "text-black dark:text-white": profit === 0,
                })}>
                  ${(profit).toLocaleString()} <span className="text-xs text-muted-foreground">(usd)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="text-xl font-bold text-black dark:text-white">Progress</div>
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            {showSkeleton ? (
              <>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <span>${previousThreshold.toLocaleString()}</span>
                <span><span className="dark:text-white text-black font-bold">${progressValue.toLocaleString()} </span>/ ${progressMax.toLocaleString()}</span>
              </>
            )}
          </div>
          {showSkeleton ? (
            <Skeleton className="h-2 w-full" />
          ) : (
            <Progress
              value={((progressValue - previousThreshold) / (progressMax - previousThreshold)) * 100}
              className="h-2 bg-muted"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
