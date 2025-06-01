import { NextResponse } from "next/server";
import { transformTransactions } from '@/app/utils/transformTransactions'
import { etherscanRateLimiter } from '@/app/utils/rateLimiter';
import { etherscanApiKeyRotator } from '@/app/utils/apiKeyRotator';

const DEX_ROUTER_ADDRESS = '0xb300000b72deaeb607a12d5f54773d1c19c7028d';


const getAlphaList = async () => {
    const response = await fetch("https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list")
    const data = await response.json();
    return {
        list: data.data.map((item: any) => ({
            symbol: item.symbol,
            name: item.name,
            price: item.price,
            decimals: item.decimals,
            logo: item.logo,
            address: item.address,
            chainId: item.chainId,
            network: item.network,
        })),
        map: data.data.reduce((acc: any, item: any) => {
            acc[item.symbol] = item;
            return acc;
        }, {}),
    };
}

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

    const alphaListResponse = await getAlphaList();

    const bnbPrice = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT");
    const bnbPriceData = await bnbPrice.json();
    const bnbPriceValue = bnbPriceData.price;

    const accountNormalUrl = new URL("https://api.etherscan.io/v2/api");
    accountNormalUrl.searchParams.set("chainid", "56");
    accountNormalUrl.searchParams.set("module", "account");
    accountNormalUrl.searchParams.set("action", "txlist");
    accountNormalUrl.searchParams.set("address", address);
    accountNormalUrl.searchParams.set("startblock", blockNumber);
    accountNormalUrl.searchParams.set("endblock", "99999999");
    accountNormalUrl.searchParams.set("page", "1");
    accountNormalUrl.searchParams.set("offset", "10000");
    accountNormalUrl.searchParams.set("sort", "desc");
    accountNormalUrl.searchParams.set("apikey", etherscanApiKeyRotator.getNextKey() || "");

    const accountNormalUrlData = await etherscanRateLimiter.execute(async () => {
        const response = await fetch(accountNormalUrl);
        return response.json();
    });

    const accountInternalUrl = new URL("https://api.etherscan.io/v2/api");
    accountInternalUrl.searchParams.set("chainid", "56");
    accountInternalUrl.searchParams.set("module", "account");
    accountInternalUrl.searchParams.set("action", "txlistinternal");
    accountInternalUrl.searchParams.set("address", address);
    accountInternalUrl.searchParams.set("startblock", blockNumber);
    accountInternalUrl.searchParams.set("endblock", "99999999");
    accountInternalUrl.searchParams.set("page", "1");
    accountInternalUrl.searchParams.set("offset", "10000");
    accountInternalUrl.searchParams.set("sort", "desc");
    accountInternalUrl.searchParams.set("apikey", etherscanApiKeyRotator.getNextKey() || "");

    const accountInternalUrlData = await etherscanRateLimiter.execute(async () => {
        const response = await fetch(accountInternalUrl);
        return response.json();
    });

    const accountBEP20Url = new URL("https://api.etherscan.io/v2/api");
    accountBEP20Url.searchParams.set("chainid", "56");
    accountBEP20Url.searchParams.set("module", "account");
    accountBEP20Url.searchParams.set("action", "tokentx");
    accountBEP20Url.searchParams.set("address", address);
    accountBEP20Url.searchParams.set("startblock", blockNumber);
    accountBEP20Url.searchParams.set("endblock", "99999999");
    accountBEP20Url.searchParams.set("page", "1");
    accountBEP20Url.searchParams.set("offset", "10000");
    accountBEP20Url.searchParams.set("sort", "desc");
    accountBEP20Url.searchParams.set("apikey", etherscanApiKeyRotator.getNextKey() || "");

    const accountBEP20UrlData = await etherscanRateLimiter.execute(async () => {
        const response = await fetch(accountBEP20Url);
        return response.json();
    });

    const alphaList = alphaListResponse.list;
    const alphaListMap = alphaListResponse.map;

    const transformedTransactions = transformTransactions(
        (accountNormalUrlData.result || []).filter((item: any) => item.from === DEX_ROUTER_ADDRESS || item.to === DEX_ROUTER_ADDRESS),
        accountInternalUrlData.result || [],
        accountBEP20UrlData.result.filter((item: any) => alphaList.find((alpha: any) => alpha.symbol === item.tokenSymbol)),
        address.toLowerCase(),
        bnbPriceValue,
        alphaListMap
    );

    const priceMap = alphaList.reduce((acc: any, item: any) => {
        acc[item.symbol] = item.price;
        return acc;
    }, {
        BNB: bnbPriceValue,
    });

    return NextResponse.json({
        price: priceMap,
        transactions: transformedTransactions,
        volume: transformedTransactions.reduce((acc: number, item: any) => {
            if (item.to.symbol !== "BNB") {
                const token = alphaListMap[item.to.symbol];
                const price = token.price;
                const value = item.to.value;
                const valueInUSD = value * price;
                return acc + valueInUSD;
            }
            return acc;
        }, 0),
    });
};

export { POST };