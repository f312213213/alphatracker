import { NextResponse } from "next/server";

const GET = async () => {
    try {
        const currentUtcMidnight = Math.floor(new Date().setUTCHours(0, 0, 0, 0) / 1000);

        const currentBlock = await fetch(
            `https://api.etherscan.io/v2/api?chainid=56&module=block&action=getblocknobytime&timestamp=${currentUtcMidnight}&closest=before&apikey=${process.env.ETHERSCAN_API_KEY}`
        );
        const currentBlockData = await currentBlock.json();

        if (currentBlockData.status !== "1") {
            throw new Error("Failed to fetch block number");
        }

        return NextResponse.json({
            blockNumber: currentBlockData.result,
            timestamp: currentUtcMidnight,
            utcDay: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        });
    } catch (error) {
        console.error("Error fetching block number:", error);
        return NextResponse.json(
            { error: "Failed to fetch block number" },
            { status: 500 }
        );
    }
};

export { GET }; 