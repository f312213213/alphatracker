import { NextResponse } from "next/server";
import { transformTransactions } from '@/app/utils/transformTransactions';

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

    const accountInfoUrl = new URL("https://api.etherscan.io/v2/api");
    accountInfoUrl.searchParams.set("chainid", "56");
    accountInfoUrl.searchParams.set("module", "account");
    accountInfoUrl.searchParams.set("action", "tokentx");
    accountInfoUrl.searchParams.set("address", address);
    accountInfoUrl.searchParams.set("startblock", blockNumber);
    accountInfoUrl.searchParams.set("endblock", "99999999");
    accountInfoUrl.searchParams.set("page", "1");
    accountInfoUrl.searchParams.set("offset", "10000");
    accountInfoUrl.searchParams.set("sort", "desc");
    accountInfoUrl.searchParams.set("apikey", process.env.ETHERSCAN_API_KEY || "");

    const accountInfoUrlResponse = await fetch(accountInfoUrl);
    const accountInfoUrlData = await accountInfoUrlResponse.json();

    const alphaList = alphaListResponse.list;
    const alphaListMap = alphaListResponse.map;

    const transformedTransactions = transformTransactions(
        accountInfoUrlData.result.filter((item: any) => alphaList.find((alpha: any) => alpha.symbol === item.tokenSymbol)),
        address.toLowerCase(),
        bnbPriceValue,
        alphaListMap
    );
    return NextResponse.json({
        bnbPrice: bnbPriceValue,
        transactions: transformedTransactions,
        volume: transformedTransactions.reduce((acc: number, item: any) => {
            if (item.to.symbol !== "BNB") {
                const token = alphaListMap[item.to.symbol];
                const price = token.price;
                const value = item.value;
                const valueInUSD = value * price;
                return acc + valueInUSD;
            }
            return acc;
        }, 0),
    });
};

export { POST };