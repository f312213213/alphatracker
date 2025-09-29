"use client"

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAlphaPoints, getNextPointsThreshold } from "./utils/calculatePoints";

export default function AlphaTrackerCalculator() {
    const [volume, setVolume] = useState<number | string>("");
    const [points, setPoints] = useState<number | null>(null);
    const [nextThreshold, setNextThreshold] = useState<number | null>(null);

    const handleCalculate = () => {
        const numericVolume = typeof volume === 'string' ? parseFloat(volume) : volume;
        if (!isNaN(numericVolume) && numericVolume > 0) {
            const calculatedPoints = calculateAlphaPoints(numericVolume);
            setPoints(calculatedPoints);
            setNextThreshold(getNextPointsThreshold(calculatedPoints));
        } else {
            setPoints(null);
            setNextThreshold(null);
        }
    };

    return (
        <Card>
            <CardHeader>
        <CardTitle className="text-xl xs:text-2xl sm:text-4xl font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="h-8 w-8">
            <path d="M17.0234 13.7824V16.4128C16.5737 16.5477 16.0117 16.6601 15.1799 16.6601C13.6061 16.6601 12.6169 16.1205 12.1673 14.9065C11.2905 15.9631 10.0315 16.75 8.16547 16.75C5.17536 16.75 2.5 14.5468 2.5 10.5225V10.4775C2.5 6.45324 5.1304 4.25 7.98561 4.25C9.80666 4.25 10.9308 5.08183 11.7401 6.04856V4.47482H15.1574V12.6133C15.1574 13.5351 15.5845 13.8498 16.3264 13.8498C16.5962 13.8498 16.8435 13.8273 17.0234 13.7824ZM8.86241 13.8498C10.4586 13.8498 11.7851 12.5234 11.7851 10.5225V10.4775C11.7851 8.47662 10.4586 7.15018 8.86241 7.15018C7.26619 7.15018 5.91727 8.45414 5.91727 10.4775V10.5225C5.91727 12.5234 7.26619 13.8498 8.86241 13.8498Z" fill="currentColor" />
            <path d="M17.5 0L20 2.5L17.5 5L15 2.5L17.5 0Z" fill="#F0B90B" />
          </svg>
          Binance Alpha Calculator
        </CardTitle>
        <CardDescription>
          Track your alpha points progress. Simply enter your trading volume to see how many points you would earn.
        </CardDescription>
      </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Input
                    type="number"
                    placeholder="Enter your trading volume"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                />
                <Button onClick={handleCalculate}>Calculate</Button>
                {points !== null && (
                    <div className="text-center">
                        <p className="text-lg">You would earn <span className="font-bold">{points}</span> alpha points.</p>
                        {nextThreshold !== null && (
                            <p className="text-sm text-gray-500">
                                You need to trade ${nextThreshold.toLocaleString()} to reach the next point.
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}