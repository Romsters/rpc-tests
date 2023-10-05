import { Web3 } from "web3";
import BN from "bn.js";
import { formatPrivateKey } from "../../../utils/web3utils";

type TransactionReceipt = {
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    blockNumber: number;
    cumulativeGasUsed: number;
    gasUsed: number;
};

export const getReceipt = async (web3: Web3, txHash: string): Promise<TransactionReceipt> => {
    while (true) {
        const receipt = await web3.eth.getTransactionReceipt(txHash);
        if (receipt) {
            return receipt as TransactionReceipt;
        }
        await new Promise(res => setTimeout(res, 1000));
    }
};

const sendTransaction = async (
    web3: Web3,
    privateKey: string,
    toAddress: string,
    amount: string,
    nonceOffset: number = 0
): Promise<{ sender: string, txHash: string, receipt?: TransactionReceipt }> => {

    const account = web3.eth.accounts.privateKeyToAccount(formatPrivateKey(web3, privateKey));
    const nonce = new BN(await web3.eth.getTransactionCount(account.address, 'pending')).add(new BN(nonceOffset));

    const tx = {
        from: account.address,
        to: toAddress,
        value: web3.utils.toWei(amount, 'ether'),
        gas: 21000,
        gasPrice: web3.utils.toWei('20', 'gwei'),
        nonce: nonce.toString()
    };

    return new Promise(async (resolve, reject) => {
        try {
            const signedTx = await account.signTransaction(tx);
            let transactionHash;
            let resolved = false;

            web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                .once('transactionHash', (hash: string) => {
                    console.log(`Transaction hash: ${hash}`);
                    transactionHash = hash;
                    if (nonceOffset !== 0 && !resolved) {
                        resolved = true;
                        resolve({ sender: account.address, txHash: hash });
                    }
                })
                .once('receipt', (receipt: TransactionReceipt) => {
                    if (resolved) return;
                    resolved = true;
                    resolve({ sender: account.address, txHash: transactionHash, receipt });
                })
                .once('error', (error) => {
                    reject(error);
                });
        } catch (error) {
            reject(error);
        }
    });
};

export default sendTransaction;
