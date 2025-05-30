"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Info } from "lucide-react";
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

function truncateMiddle(str: string, front = 6, back = 6) {
  if (!str) return "";
  if (str.length <= front + back) return str;
  return `${str.slice(0, front)}...${str.slice(-back)}`;
}

export default function AlphaTrackerProgress() {
  const [address] = useQueryState('address');
  const { data, error, isLoading } = useAlphaData();


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

  const volume = (data?.volume * 2) || 0;
  const points = calculateAlphaPoints(volume);
  const nextThreshold = getNextPointsThreshold(points);
  const previousThreshold = points > 1 ? getNextPointsThreshold(points - 1) : 0;
  const progressValue = volume;
  const progressMax = nextThreshold;
  const profit = 0; // TODO: Calculate profit from transactions

  const showSkeleton = isLoading;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-col items-start">
          <div className="text-xl font-bold text-white dark:text-white">Wallet</div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm font-mono">{truncateMiddle(address)}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => navigator.clipboard.writeText(address || "")}><Copy className="h-4 w-4" /></Button>
            {/* <Button variant="ghost" size="icon" className="h-6 w-6 p-0"><ExternalLink className="h-4 w-4" /></Button> */}
          </div>
        </div>

        <div>
          {/* <div className="text-xl font-bold text-white dark:text-white">Stats</div> */}
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col min-w-[90px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Volume <Badge className="bg-muted text-xs px-1.5 py-0.5">2x with BSC event</Badge>
              </div>
              {showSkeleton ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <div className="text-lg font-semibold text-white dark:text-white mt-1">
                  ${volume.toLocaleString()} <span className="text-xs text-muted-foreground">({data?.volume.toLocaleString()})</span>
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
                <div className="text-lg font-semibold text-white dark:text-white mt-1">
                  {points}
                </div>
              )}
            </div>
            {/* <div className="flex flex-col min-w-[80px]">
              <div className="text-sm text-muted-foreground">Loss</div>
              {showSkeleton ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <div className="text-lg font-semibold mt-1 text-red-500">
                  ${profit.toLocaleString()}
                </div>
              )}
            </div> */}
          </div>
        </div>

        <div>
          <div className="text-xl font-bold text-white dark:text-white">Progress</div>
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            {showSkeleton ? (
              <>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <span>${previousThreshold.toLocaleString()}</span>
                <span>${progressValue.toLocaleString()} / ${progressMax.toLocaleString()}</span>
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
