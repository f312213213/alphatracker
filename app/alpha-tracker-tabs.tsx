"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import AlphaTrackerTransactionTable from "./alpha-tracker-transaction-table"
import { useQueryState } from "nuqs";
import { useAlphaData } from "./hooks/useAlphaData";
import AlphaTrackerTokenTable from "./alpha-tracker-token-table";
export default function AlphaTrackerTabs() {

  const [address] = useQueryState('address');
  const { data, isLoading, tokenList, tokenMap } = useAlphaData();

  if (!address || !data && !isLoading) {
    return null;
  }

  return (
    <Tabs defaultValue="transactions">
      <TabsList>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="tokens">Tokens</TabsTrigger>
      </TabsList>
      <TabsContent value="transactions">
        <AlphaTrackerTransactionTable data={data} isLoading={isLoading} />
      </TabsContent>
      <TabsContent value="tokens">
        <AlphaTrackerTokenTable data={data} isLoading={isLoading} tokenList={tokenList} tokenMap={tokenMap} />
      </TabsContent>

    </Tabs>
  )
}