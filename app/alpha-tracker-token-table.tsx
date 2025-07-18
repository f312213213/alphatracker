import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryState } from "nuqs";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";


interface AlphaTrackerTableProps {
  data: any;
  isLoading: boolean;
  tokenList: any;
  tokenMap: any;
}

function truncateMiddle(str: string, front = 6, back = 6) {
  if (!str) return "";
  if (str.length <= front + back) return str;
  return `${str.slice(0, front)}...${str.slice(-back)}`;
}

export default function AlphaTrackerTokenTable({ data, isLoading, tokenList, tokenMap }: AlphaTrackerTableProps) {
  const [address] = useQueryState('address');

  const showSkeleton = isLoading;

  const rowCount = showSkeleton ? 8 : tokenList.length;

  return (
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
              <TableHead className="w-40">Token</TableHead>
              <TableHead className="w-40 text-right">Outgoing</TableHead>
              <TableHead className="w-40 text-right">Incoming</TableHead>
              <TableHead className="w-48 text-right">Net</TableHead>
              <TableHead className="w-40 text-right">Profit</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {tokenList.length === 0 && !showSkeleton ? (
                <motion.tr
                  key="no-data"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No tokens recorded for this address
                  </TableCell>
                </motion.tr>
              ) : (
                Array.from({ length: rowCount }).map((_, i) => {
                  if (showSkeleton) {
                    return (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell className="text-center"><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><div className="flex justify-end"><Skeleton className="h-4 w-16" /></div></TableCell>
                        <TableCell><div className="flex justify-end"><Skeleton className="h-4 w-16" /></div></TableCell>
                        <TableCell><div className="flex justify-end"><Skeleton className="h-4 w-16" /></div></TableCell>
                        <TableCell><div className="flex justify-end"><Skeleton className="h-4 w-16" /></div></TableCell>
                      </TableRow>
                    );
                  }
                  const token = tokenList[i];
                  if (!token) return null;
                  return (
                    <motion.tr
                      key={token}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.1, delay: i * 0.01 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>{token === 'BSC-USD' ? 'USDT' : token} <p className="text-xs text-muted-foreground">({truncateMiddle(tokenMap[token].address)})</p></TableCell>
                      <TableCell className="text-right">{tokenMap[token].outgoing.toFixed(6)}</TableCell>
                      <TableCell className="text-right">{tokenMap[token].incoming.toFixed(6)}</TableCell>
                      <TableCell className={cn("text-right", {
                        "text-red-500": tokenMap[token].incoming - tokenMap[token].outgoing < 0,
                        "text-green-500": tokenMap[token].incoming - tokenMap[token].outgoing > 0,
                        "text-black dark:text-gray-400": tokenMap[token].incoming - tokenMap[token].outgoing === 0,
                      })}>{(tokenMap[token].incoming - tokenMap[token].outgoing).toFixed(6)}</TableCell>
                      <TableCell className={cn("text-right", {
                        "text-red-500": tokenMap[token].profit < 0,
                        "text-green-500": tokenMap[token].profit > 0,
                        "text-black dark:text-gray-400": tokenMap[token].profit === 0,
                      })}>{tokenMap[token].profit.toFixed(6) ?? (0).toFixed(6)}</TableCell>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </motion.div>
    </AnimatePresence>
  );
}