"use client"

import { useQueryState } from 'nuqs';
import AlphaTrackerHeader from "./alpha-tracker-header";
import AlphaTrackerProgress from "./alpha-tracker-progress";
import AlphaTrackerTabs from "./alpha-tracker-tabs";
import AlphaTrackerCalculator from "./alpha-tracker-calculator";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function AlphaTrackerPageContainer() {
  const [calculatorMode, setCalculatorMode] = useQueryState('calculator', {
    defaultValue: true,
    parse: (value: string) => value === 'true',
    serialize: (value: boolean) => value.toString()
  });

  return (
    <div className="mx-auto max-w-xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl px-8 py-16 flex flex-col gap-4 min-h-[calc(100vh-52px)]">
      <div className="flex items-center space-x-2">
        <Switch
          id="calculator-mode"
          checked={calculatorMode}
          onCheckedChange={setCalculatorMode}
        />
        <Label htmlFor="calculator-mode" className="text-sm font-medium">
          Calculator Mode
        </Label>
      </div>
      {calculatorMode ? <AlphaTrackerCalculator /> : (
        <>
          <AlphaTrackerHeader />
          <AlphaTrackerProgress />
          <AlphaTrackerTabs />
        </>
      )}
    </div>
  );
}