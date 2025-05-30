import { BigNumber } from 'bignumber.js';

interface RawTransaction {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    from: string;
    contractAddress: string;
    to: string;
    value: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimal: string;
    transactionIndex: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    cumulativeGasUsed: string;
    input: string;
    methodId: string;
    functionName: string;
    confirmations: string;
}

interface TransformedTransaction {
    hash: string;
    timestamp: number;
    gas: number;
    status: 'success' | 'failed';
    value: number;
    from: {
        address: string;
        symbol: string;
        decimals: number;
    };
    to: {
        address: string;
        symbol: string;
        decimals: number;
    };
}

export function transformTransactions(rawTransactions: RawTransaction[], address: string): TransformedTransaction[] {
    const transactionGroups = rawTransactions.reduce((groups, tx) => {
        if (!groups[tx.hash]) {
            groups[tx.hash] = [];
        }
        groups[tx.hash].push(tx);
        return groups;
    }, {} as Record<string, RawTransaction[]>);

    return Object.entries(transactionGroups).map(([hash, txs]) => {

        txs.sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));

        const gasCost = new BigNumber(txs[0].gasUsed)
            .multipliedBy(txs[0].gasPrice)
            .dividedBy(new BigNumber(10).pow(18))
            .toNumber();

        const status = txs.every(tx => new BigNumber(tx.value).gt(0)) ? 'success' : 'failed';

        const timestamp = parseInt(txs[0].timeStamp);

        const outgoingTx = txs.find(tx => tx.from === address);
        const incomingTx = txs.find(tx => tx.to === address);

        const value = new BigNumber(incomingTx?.value || '0')
            .dividedBy(new BigNumber(10).pow(parseInt(incomingTx?.tokenDecimal || '18')))
            .toNumber();

        return {
            hash,
            timestamp,
            gas: gasCost,
            status,
            value,
            from: {
                address: outgoingTx?.contractAddress || '0x0000000000000000000000000000000000000000',
                symbol: outgoingTx?.tokenSymbol || 'BNB',
                decimals: parseInt(outgoingTx?.tokenDecimal || '18'),
            },
            to: {
                address: incomingTx?.contractAddress || '0x0000000000000000000000000000000000000000',
                symbol: incomingTx?.tokenSymbol || 'BNB',
                decimals: parseInt(incomingTx?.tokenDecimal || '18'),
            },
        };
    });
} 