"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";

interface AlphaTrackerTableProps {
  data: any;
  isLoading: boolean;
  showAllTransactions: boolean;
}

function truncateMiddle(str: string, front = 6, back = 6) {
  if (!str) return "";
  if (str.length <= front + back) return str;
  return `${str.slice(0, front)}...${str.slice(-back)}`;
}

function timeAgo(timestamp: string | number) {
  const now = Date.now();
  const t = typeof timestamp === "string" ? new Date(timestamp).getTime() : Number(timestamp) * 1000;
  const diff = Math.floor((now - t) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export default function AlphaTrackerTransactionTable({ data, isLoading, showAllTransactions }: AlphaTrackerTableProps) {
  const [address] = useQueryState('address');

  const transactions = data?.transactions || [];
  const showSkeleton = isLoading;

  const filteredTransactions = showAllTransactions
    ? transactions
    : transactions.filter((tx: any) => tx.contributeToVolume);

  const rowCount = showSkeleton ? 8 : filteredTransactions.length;

  return (
    <div className="space-y-4 relative">


      <AnimatePresence>
        <motion.div
          key={`${address}-${isLoading}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 text-center">#</TableHead>
                <TableHead className="w-40">Tx Hash</TableHead>
                <TableHead className="w-32">
                  Time
                </TableHead>
                <TableHead className="w-40 text-right">Sent</TableHead>
                <TableHead className="w-40 text-right">Received</TableHead>

                <TableHead className="w-48 text-right">Gas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredTransactions.length === 0 && !showSkeleton ? (
                  <motion.tr
                    key="no-data"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No transactions found for this address
                    </TableCell>
                  </motion.tr>
                ) : (
                  Array.from({ length: rowCount }).map((_, i) => {
                    if (showSkeleton) {
                      return (
                        <TableRow key={`skeleton-${i}`}>
                          <TableCell className="text-center"><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><div className="flex justify-end"><Skeleton className="h-4 w-24" /></div></TableCell>
                          <TableCell><div className="flex justify-end"><Skeleton className="h-4 w-24" /></div></TableCell>
                          <TableCell><div className="flex justify-end"><Skeleton className="h-4 w-16" /></div></TableCell>
                        </TableRow>
                      );
                    }
                    const tx = filteredTransactions[i];
                    if (!tx) return null;
                    return (
                      <motion.tr
                        key={tx.hash}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.1, delay: i * 0.01 }}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <TableCell className="text-center text-muted-foreground">{filteredTransactions.length - i}</TableCell>
                        <TableCell className="">
                          <a href={`https://bscscan.com/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                            {truncateMiddle(tx.hash)}
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        </TableCell>
                        <TableCell>{timeAgo(tx.timestamp)}</TableCell>
                        <TableCell className="text-right">
                          {tx.from.value.toFixed(6)} {tx.from.symbol === 'BSC-USD' ? 'USDT' : tx.from.symbol} <p className="text-sm text-muted-foreground">({truncateMiddle(tx.from.address)})</p>
                        </TableCell>
                        <TableCell className="text-right">
                          {tx.to.value.toFixed(6)} {tx.to.symbol === 'BSC-USD' ? 'USDT' : tx.to.symbol} <p className="text-sm text-muted-foreground">({truncateMiddle(tx.to.address)})</p>
                        </TableCell>

                        <TableCell className="text-right">
                          {tx.gas} <span className="text-xs text-muted-foreground">BNB</span>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

