"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink } from "lucide-react";
import { useQueryState } from "nuqs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlphaData } from "./hooks/useAlphaData";

export default function AlphaTrackerProgress() {
  const [address] = useQueryState('address');
  const { data, error, isLoading } = useAlphaData();

  console.log({ isLoading });

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
  const progressValue = volume;
  const progressMax = 32768;
  const points = Math.floor(volume / 1000); // 1 point per 1000 volume
  const profit = 0; // TODO: Calculate profit from transactions

  const showSkeleton = isLoading;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-col items-start">
          <div className="text-xl font-bold text-white dark:text-white">Wallet</div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm font-mono">{address}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0"><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0"><ExternalLink className="h-4 w-4" /></Button>
          </div>
        </div>

        <div>
          <div className="text-xl font-bold text-white dark:text-white">Stats</div>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col min-w-[90px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Volume <Badge className="bg-muted text-xs px-1.5 py-0.5">2x with BSC event</Badge>
              </div>
              {showSkeleton ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <div className="text-lg font-semibold text-white dark:text-white mt-1">
                  ${volume.toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-[60px]">
              <div className="text-sm text-muted-foreground">Points</div>
              {showSkeleton ? (
                <Skeleton className="h-7 w-12 mt-1" />
              ) : (
                <div className="text-lg font-semibold text-white dark:text-white mt-1">
                  {points}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-[80px]">
              <div className="text-sm text-muted-foreground">Loss</div>
              {showSkeleton ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <div className="text-lg font-semibold mt-1 text-red-500">
                  ${profit.toLocaleString()}
                </div>
              )}
            </div>
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
                <span>${progressValue.toLocaleString()}</span>
                <span>${progressValue.toLocaleString()} / ${progressMax.toLocaleString()}</span>
              </>
            )}
          </div>
          {showSkeleton ? (
            <Skeleton className="h-2 w-full" />
          ) : (
            <Progress value={progressValue / progressMax * 100} className="h-2 bg-muted" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
