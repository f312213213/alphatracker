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
    const { address } = await req.json();

    const currentBlock = await fetch("https://api.etherscan.io/v2/api?chainid=56&module=block&action=getblocknobytime&timestamp=" + Math.floor(new Date().setUTCHours(0, 0, 0, 0) / 1000) + "&closest=before&apikey=" + process.env.ETHERSCAN_API_KEY);
    const currentBlockData = await currentBlock.json();
    const currentBlockNumber = currentBlockData.result;


    const accountInfoUrl = new URL("https://api.etherscan.io/v2/api");
    accountInfoUrl.searchParams.set("chainid", "56");
    accountInfoUrl.searchParams.set("module", "account");
    accountInfoUrl.searchParams.set("action", "tokentx");
    accountInfoUrl.searchParams.set("address", address);
    accountInfoUrl.searchParams.set("startblock", currentBlockNumber);
    accountInfoUrl.searchParams.set("endblock", "99999999");
    accountInfoUrl.searchParams.set("page", "1");
    accountInfoUrl.searchParams.set("offset", "10000");
    accountInfoUrl.searchParams.set("sort", "desc");
    accountInfoUrl.searchParams.set("apikey", process.env.ETHERSCAN_API_KEY || "");

    const accountInfoUrlResponse = await fetch(accountInfoUrl);
    const accountInfoUrlData = await accountInfoUrlResponse.json();

    console.log("accountInfoUrlData", accountInfoUrlData.result);

    const alphaListResponse = await getAlphaList();
    const alphaList = alphaListResponse.list;
    const alphaListMap = alphaListResponse.map;

    const transformedTransactions = transformTransactions(accountInfoUrlData.result.filter((item: any) => alphaList.find((alpha: any) => alpha.symbol === item.tokenSymbol)), address.toLowerCase());
    return NextResponse.json({
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