import AlphaTrackerHeader from "./alpha-tracker-header";
import AlphaTrackerProgress from "./alpha-tracker-progress";
import AlphaTrackerTable from "./alpha-tracker-table";
import { Suspense } from 'react'

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="mx-auto max-w-xl sm:max-w-3xl px-8 py-16 flex flex-col gap-4">
        <AlphaTrackerHeader />
        <AlphaTrackerProgress />
        <AlphaTrackerTable />
      </div>
    </Suspense>
  );
}

