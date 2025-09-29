import AlphaTrackerFooter from "./alpha-tracker-footer";
import { Suspense } from 'react'
import AlphaTrackerPageContainer from "./alpha-tracker-page-container";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AlphaTrackerPageContainer />
      <AlphaTrackerFooter />
    </Suspense>
  );
}

