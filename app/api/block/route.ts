import { NextResponse } from "next/server";
import { bscscanClient } from '@/app/utils/bscscanClient';
import { etherscanApiKeyRotator } from '@/app/utils/apiKeyRotator';
const GET = async () => {
    try {
        const currentUtcMidnight = Math.floor(new Date().setUTCHours(0, 0, 0, 0) / 1000);

        const currentBlockResponse = await bscscanClient.getBlockNumber(
            currentUtcMidnight,
            etherscanApiKeyRotator.getNextKey() || ""
        );

        if (currentBlockResponse.status !== "1") {
            throw new Error(`Failed to fetch block number: ${currentBlockResponse.message}`);
        }

        return NextResponse.json({
            blockNumber: currentBlockResponse.result,
            timestamp: currentUtcMidnight,
            utcDay: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        });
    } catch (error) {
        console.error("Error fetching block number:", error);

        // Provide more specific error messages based on the error type
        if (error instanceof Error) {
            if (error.message.includes('circuit breaker')) {
                return NextResponse.json(
                    {
                        error: "Block data service temporarily unavailable. Please try again later.",
                        retryAfter: 60
                    },
                    { status: 503 }
                );
            }

            if (error.message.includes('failed after')) {
                return NextResponse.json(
                    {
                        error: "Unable to fetch current block data after multiple attempts.",
                        suggestion: "Please try again in a few moments"
                    },
                    { status: 502 }
                );
            }
        }

        return NextResponse.json(
            { error: "Failed to fetch block number" },
            { status: 500 }
        );
    }
};

export { GET }; 