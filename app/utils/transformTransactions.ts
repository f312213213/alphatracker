import { BigNumber } from 'bignumber.js';

interface RawNormalTransaction {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    isError: string;
    txreceipt_status: string;
    input: string;
    contractAddress: string;
    cumulativeGasUsed: string;
    confirmations: string;
}

interface RawInternalTransaction {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    contractAddress: string;
    input: string;
    type: string;
    gas: string;
    gasUsed: string;
    traceId: string;
    isError: string;
    errCode: string;
}

interface RawTokenTransaction {
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
    confirmations: string;
}

interface TransformedTransaction {
    hash: string;
    timestamp: number;
    gas: number | null;
    status: 'success' | 'fail';
    from: {
        address: string;
        symbol: string;
        decimals: number;
        value: number;
    };
    to: {
        address: string;
        symbol: string;
        decimals: number;
        value: number;
    };
}

interface TransactionMovement {
    hash: string;
    timestamp: number;
    gas: number | null;
    status: 'success' | 'fail';
    fromAddress: string;
    contractAddress: string;
    toAddress: string;
    symbol: string;
    decimals: number;
    value: number;
    type: 'bnb' | 'token';
}

export function transformTransactions(
    normalTransactions: RawNormalTransaction[],
    internalTransactions: RawInternalTransaction[],
    tokenTransactions: RawTokenTransaction[],
    userAddress: string,
    bnbPrice: number,
    alphaListMap: Record<string, any>
): TransformedTransaction[] {

    // Group all transactions by hash
    const transactionGroups: Record<string, {
        normal: RawNormalTransaction[];
        internal: RawInternalTransaction[];
        token: RawTokenTransaction[];
    }> = {};

    // Process normal transactions
    normalTransactions.forEach(tx => {
        if (!transactionGroups[tx.hash]) {
            transactionGroups[tx.hash] = { normal: [], internal: [], token: [] };
        }
        transactionGroups[tx.hash].normal.push(tx);
    });

    // Process internal transactions
    internalTransactions.forEach(tx => {
        if (!transactionGroups[tx.hash]) {
            transactionGroups[tx.hash] = { normal: [], internal: [], token: [] };
        }
        transactionGroups[tx.hash].internal.push(tx);
    });

    // Process token transactions
    tokenTransactions.forEach(tx => {
        if (!transactionGroups[tx.hash]) {
            transactionGroups[tx.hash] = { normal: [], internal: [], token: [] };
        }
        transactionGroups[tx.hash].token.push(tx);
    });

    const movements: TransactionMovement[] = [];

    // Process each transaction hash
    Object.entries(transactionGroups).forEach(([hash, txGroup]) => {
        const allTxs = [...txGroup.normal, ...txGroup.internal, ...txGroup.token];

        // Get earliest timestamp
        const timestamp = Math.min(...allTxs.map(tx => parseInt(tx.timeStamp)));

        // Calculate gas cost (prefer token tx, then normal tx)
        let gas: number | null = null;
        const gasSource = txGroup.token[0] || txGroup.normal[0];
        if (gasSource && gasSource.gasUsed && gasSource.gasPrice) {
            gas = new BigNumber(gasSource.gasUsed)
                .multipliedBy(gasSource.gasPrice)
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber();
        }

        // Determine status (fail if any transaction has isError: "1")
        const status = allTxs.some(tx => {
            if ('isError' in tx) {
                return tx.isError === "1";
            }
            return false;
        }) ? 'fail' : 'success';

        // Process BNB movements (normal + internal)
        [...txGroup.normal, ...txGroup.internal].forEach(tx => {
            if (new BigNumber(tx.value).gt(0)) {
                movements.push({
                    hash,
                    timestamp,
                    gas,
                    status,
                    fromAddress: tx.from,
                    contractAddress: '0x0000000000000000000000000000000000000000',
                    toAddress: tx.to,
                    symbol: 'BNB',
                    decimals: 18,
                    value: new BigNumber(tx.value)
                        .dividedBy(new BigNumber(10).pow(18))
                        .toNumber(),
                    type: 'bnb'
                });
            }
        });

        // Process token movements
        txGroup.token.forEach(tx => {
            if (new BigNumber(tx.value).gt(0)) {
                movements.push({
                    hash,
                    timestamp,
                    gas,
                    status,
                    fromAddress: tx.from,
                    contractAddress: tx.contractAddress,
                    toAddress: tx.to,
                    symbol: tx.tokenSymbol,
                    decimals: parseInt(tx.tokenDecimal),
                    value: new BigNumber(tx.value)
                        .dividedBy(new BigNumber(10).pow(parseInt(tx.tokenDecimal)))
                        .toNumber(),
                    type: 'token'
                });
            }
        });
    });

    // Group movements by hash to create from/to pairs
    const movementGroups = movements.reduce((groups, movement) => {
        if (!groups[movement.hash]) {
            groups[movement.hash] = [];
        }
        groups[movement.hash].push(movement);
        return groups;
    }, {} as Record<string, TransactionMovement[]>);

    const result: TransformedTransaction[] = [];

    // Create transactions from movement pairs
    Object.entries(movementGroups).forEach(([hash, movementList]) => {
        // Sort movements by timestamp to ensure consistent pairing
        movementList.sort((a, b) => a.timestamp - b.timestamp);

        // Find movements involving the user address
        const userMovements = movementList.filter(m =>
            m.fromAddress.toLowerCase() === userAddress.toLowerCase() ||
            m.toAddress.toLowerCase() === userAddress.toLowerCase()
        );

        if (userMovements.length === 0) return;

        // For swaps, we need to pair outgoing and incoming movements
        const outgoingMovements = userMovements.filter(m =>
            m.fromAddress.toLowerCase() === userAddress.toLowerCase()
        );
        const incomingMovements = userMovements.filter(m =>
            m.toAddress.toLowerCase() === userAddress.toLowerCase()
        );

        if (outgoingMovements.length > 0 && incomingMovements.length > 0) {
            // This is likely a swap - pair each outgoing with each incoming
            outgoingMovements.forEach(outgoing => {
                incomingMovements.forEach(incoming => {
                    // Skip if same token (probably not a meaningful swap)
                    if (outgoing.symbol === incoming.symbol) return;

                    result.push({
                        hash,
                        timestamp: outgoing.timestamp,
                        gas: outgoing.gas,
                        status: outgoing.status,
                        from: {
                            address: outgoing.contractAddress, // Contract address for outgoing token
                            symbol: outgoing.symbol,
                            decimals: outgoing.decimals,
                            value: outgoing.value,
                        },
                        to: {
                            address: incoming.contractAddress, // Contract address for incoming token
                            symbol: incoming.symbol,
                            decimals: incoming.decimals,
                            value: incoming.value,
                        },
                    });
                });
            });
        } else if (outgoingMovements.length > 0) {
            // Only outgoing movements (transfers out)
            outgoingMovements.forEach(movement => {
                result.push({
                    hash,
                    timestamp: movement.timestamp,
                    gas: movement.gas,
                    status: movement.status,
                    from: {
                        address: userAddress,
                        symbol: movement.symbol,
                        decimals: movement.decimals,
                        value: movement.value,
                    },
                    to: {
                        address: movement.toAddress,
                        symbol: movement.symbol,
                        decimals: movement.decimals,
                        value: movement.value,
                    },
                });
            });
        } else if (incomingMovements.length > 0) {
            // Only incoming movements (transfers in)
            incomingMovements.forEach(movement => {
                result.push({
                    hash,
                    timestamp: movement.timestamp,
                    gas: movement.gas,
                    status: movement.status,
                    from: {
                        address: movement.fromAddress,
                        symbol: movement.symbol,
                        decimals: movement.decimals,
                        value: movement.value,
                    },
                    to: {
                        address: userAddress,
                        symbol: movement.symbol,
                        decimals: movement.decimals,
                        value: movement.value,
                    },
                });
            });
        }
    });

    // Sort by timestamp descending
    return result.sort((a, b) => b.timestamp - a.timestamp);
} 