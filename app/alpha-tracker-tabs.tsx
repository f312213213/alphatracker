"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AlphaTrackerTransactionTable from "./alpha-tracker-transaction-table"
import { useQueryState } from "nuqs";
import { useAlphaData } from "./hooks/useAlphaData";
import AlphaTrackerTokenTable from "./alpha-tracker-token-table";
import { useState } from "react";

export default function AlphaTrackerTabs() {
  const [currentTab, setCurrentTab] = useQueryState('tab', {
    defaultValue: "transactions",
    parse: (value: string) => value,
    serialize: (value: string) => value
  });
  const [address] = useQueryState('address', {
    parse: (value: string) => value,
    serialize: (value: string) => value
  });
  const [showAllTransactions, setShowAllTransactions] = useQueryState('showAllTransactions', {
    defaultValue: false,
    parse: (value: string) => value === 'true',
    serialize: (value: boolean) => value.toString()
  });
  const { data, isLoading, tokenList, tokenMap } = useAlphaData();

  if (!address || (!data && !isLoading)) {
    return null;
  }

  return (
    <Tabs value={currentTab} onValueChange={setCurrentTab}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>
        {
          currentTab === "transactions" && (
            <div className="flex items-center space-x-2 ml-auto">
              <Switch
                id="show-all-transactions"
                checked={showAllTransactions}
                onCheckedChange={setShowAllTransactions}
              />
              <Label htmlFor="show-all-transactions" className="text-sm font-medium">
                Show all transactions
              </Label>
            </div>
          )
        }
      </div>
      <TabsContent value="transactions">
        <AlphaTrackerTransactionTable data={data} isLoading={isLoading} showAllTransactions={showAllTransactions} />
      </TabsContent>
      <TabsContent value="tokens">
        <AlphaTrackerTokenTable data={data} isLoading={isLoading} tokenList={tokenList} tokenMap={tokenMap} />
      </TabsContent>
    </Tabs>
  )
}