"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import AlphaTrackerTable from "./alpha-tracker-table"
import { useState } from "react";
import { useQueryState } from "nuqs";
import { useAlphaData } from "./hooks/useAlphaData";

export default function AlphaTrackerTabs() {
  const [tab, setTab] = useState('transactions');

  const [address] = useQueryState('address');
  const { data, isLoading } = useAlphaData();

  const transactions = data?.transactions || [];
  const showSkeleton = isLoading;

  if (!address || !data && !isLoading) {
    return null;
  }

  return (
    <Tabs defaultValue="transactions" onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="tokens">Tokens</TabsTrigger>
      </TabsList>
      <TabsContent value="transactions">
        <AlphaTrackerTable />
      </TabsContent>

    </Tabs>
  )
}