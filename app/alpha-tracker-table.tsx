"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { useAlphaData } from "./hooks/useAlphaData";
import { useQueryState } from "nuqs";

function truncateMiddle(str: string, front = 6, back = 4) {
  if (!str) return "";
  if (str.length <= front + back) return str;
  return `${str.slice(0, front)}...${str.slice(-back)}`;
}

function timeAgo(timestamp: string | number) {
  const now = Date.now();
  const t = typeof timestamp === "string" ? new Date(timestamp).getTime() : Number(timestamp) * 1000;
  const diff = Math.floor((now - t) / 1000);
  if (diff < 60) return `${diff} 秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}

export default function AlphaTrackerTable() {
  const [address] = useQueryState('address');
  const { data, isLoading } = useAlphaData();

  const transactions = data?.transactions || [];
  const showSkeleton = isLoading;
  const rowCount = showSkeleton ? 8 : transactions.length;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 text-center">#</TableHead>
            <TableHead className="w-40">Tx Hash</TableHead>
            <TableHead className="w-32 flex items-center gap-1">
              Time
            </TableHead>
            <TableHead className="w-40">From</TableHead>
            <TableHead className="w-40">To</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, i) => {
            if (showSkeleton) {
              return (
                <TableRow key={i}>
                  <TableCell className="text-center"><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              );
            }
            const tx = transactions[i];
            if (!tx) return null;
            return (
              <TableRow key={tx.hash}>
                <TableCell className="text-center text-muted-foreground font-mono">{transactions.length - i}</TableCell>
                <TableCell className="font-mono">{truncateMiddle(tx.hash)}</TableCell>
                <TableCell>{timeAgo(tx.timestamp)}</TableCell>
                <TableCell className="font-mono">
                  {tx.from.symbol} <span className="text-xs text-muted-foreground">({truncateMiddle(tx.from.address)})</span>
                </TableCell>
                <TableCell className="font-mono">
                  {tx.to.symbol} <span className="text-xs text-muted-foreground">({truncateMiddle(tx.to.address)})</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

