import { NextResponse } from "next/server";
import { transformTransactions } from '@/app/utils/transformTransactions'
import { etherscanRateLimiter } from '@/app/utils/rateLimiter';
import { etherscanApiKeyRotator } from '@/app/utils/apiKeyRotator';

const DEX_ROUTER_ADDRESS = '0xb300000b72deaeb607a12d5f54773d1c19c7028d';

const getAlphaList = async () => {
    const response = await fetch("https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list")
    const data = await response.json();
    const list = data.data
    return {
        list: list.map((item: any) => ({
            symbol: item.symbol,
            name: item.name,
            price: item.price,
            decimals: item.decimals,
            logo: item.logo,
            address: item.address,
            chainId: item.chainId,
            network: item.network,
        })),
        map: list.reduce((acc: any, item: any) => {
            acc[item.symbol] = item;
            return acc;
        }, {}),
    };
}

// Simple function to make direct API calls without retry logic
const makeDirectApiCall = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
};

const POST = async (req: Request) => {
    const { address, blockNumber } = await req.json();

    if (!address) {
        return NextResponse.json(
            { error: "Address is required" },
            { status: 400 }
        );
    }

    if (!blockNumber) {
        return NextResponse.json(
            { error: "Block number is required" },
            { status: 400 }
        );
    }

    try {
        const alphaListResponse = await getAlphaList();

        const bnbPrice = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT");
        const bnbPriceData = await bnbPrice.json();
        const bnbPriceValue = bnbPriceData.price;

        // Build URLs for direct API calls
        const baseUrl = "https://api.etherscan.io/v2/api";
        const commonParams = new URLSearchParams({
            chainid: "56",
            module: "account",
            address: address,
            startblock: blockNumber,
            endblock: "99999999",
            page: "1",
            offset: "10000",
            sort: "desc"
        });

        const normalTxUrl = `${baseUrl}?${commonParams}&action=txlist&apikey=${etherscanApiKeyRotator.getNextKey()}`;
        const internalTxUrl = `${baseUrl}?${commonParams}&action=txlistinternal&apikey=${etherscanApiKeyRotator.getNextKey()}`;
        const tokenTxUrl = `${baseUrl}?${commonParams}&action=tokentx&apikey=${etherscanApiKeyRotator.getNextKey()}`;

        // Use rate limiter with direct fetch calls (no retry logic)
        const [accountNormalResponse, accountInternalResponse, accountBEP20Response] = await Promise.all([
            etherscanRateLimiter.execute(() => makeDirectApiCall(normalTxUrl)),
            etherscanRateLimiter.execute(() => makeDirectApiCall(internalTxUrl)),
            etherscanRateLimiter.execute(() => makeDirectApiCall(tokenTxUrl))
        ]);

        // Extract results
        const normalTransactions = accountNormalResponse.result || [];
        const internalTransactions = accountInternalResponse.result || [];
        const tokenTransactions = accountBEP20Response.result || [];

        // console.log('normalTransactions', normalTransactions);
        // console.log('internalTransactions', internalTransactions);
        // console.log('tokenTransactions', tokenTransactions);

        // console.log('Transaction data summary:', {
        //     address,
        //     blockNumber,
        //     normalCount: normalTransactions.length,
        //     internalCount: internalTransactions.length,
        //     tokenCount: tokenTransactions.length,
        //     circuitBreakerStatus: bscscanClient.getCircuitBreakerStatus()
        // });

        // Check for suspiciously empty results and warn
        if (normalTransactions.length === 0 && internalTransactions.length === 0 && tokenTransactions.length === 0) {
            console.warn('All transaction queries returned empty results - this might indicate an API issue or new wallet', {
                address,
                blockNumber,
                normalStatus: accountNormalResponse.status,
                internalStatus: accountInternalResponse.status,
                tokenStatus: accountBEP20Response.status
            });
        }

        const alphaList = alphaListResponse.list;
        const alphaListMap = alphaListResponse.map;

        const transformedTransactions = transformTransactions(
            normalTransactions.filter((item: any) => item.from === DEX_ROUTER_ADDRESS || item.to === DEX_ROUTER_ADDRESS),
            internalTransactions,
            tokenTransactions,
            address.toLowerCase(),
            bnbPriceValue,
            alphaListMap
        );

        const priceMap = alphaList.reduce((acc: any, item: any) => {
            acc[item.symbol] = item.price;
            return acc;
        }, {
            BNB: bnbPriceValue,
            'BSC-USD': 1,
            'USDC': 1,
            'USDT': 1,
            'USDS': 1,
            'TUSD': 1,
        });

        const volume = transformedTransactions.reduce((acc: number, item: any) => {
            if (alphaListMap[item.to.symbol]) {
                const token = alphaListMap[item.to.symbol];
                const price = token.price;
                const value = item.to.value;
                const valueInUSD = value * price;
                return acc + valueInUSD;
            }
            return acc;
        }, 0);

        return NextResponse.json({
            price: priceMap,
            transactions: transformedTransactions,
            volume
        });

    } catch (error) {
        console.error('Error in calculate route:', error);

        // Simplified error handling without retry-specific messages
        if (error instanceof Error) {
            return NextResponse.json(
                {
                    error: "Failed to retrieve transaction data from blockchain API",
                    details: error.message
                },
                { status: 502 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error occurred while fetching transaction data" },
            { status: 500 }
        );
    }
};

export { POST };