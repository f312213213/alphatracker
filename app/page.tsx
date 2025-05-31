import AlphaTrackerHeader from "./alpha-tracker-header";
import AlphaTrackerProgress from "./alpha-tracker-progress";
import AlphaTrackerTable from "./alpha-tracker-table";
import AlphaTrackerFooter from "./alpha-tracker-footer";
import { Suspense } from 'react'

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="mx-auto max-w-xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl px-8 py-16 flex flex-col gap-4 min-h-[calc(100vh-52px)]">
        <AlphaTrackerHeader />
        <AlphaTrackerProgress />
        <AlphaTrackerTable />
      </div>
      <AlphaTrackerFooter />
    </Suspense>
  );
}

