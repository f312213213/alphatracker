import AlphaTrackerHeader from "./alpha-tracker-header";
import AlphaTrackerProgress from "./alpha-tracker-progress";

export default function Home() {
  return (

    <div className="mx-auto max-w-xl sm:max-w-3xl px-8 py-16 flex flex-col gap-4">
      <AlphaTrackerHeader />
      <AlphaTrackerProgress />
    </div>
  );
}

