import { Web3 } from "web3";
import { formatPrivateKey } from "../../../utils/web3utils";

type TransactionReceipt = {
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    blockNumber: number;
    cumulativeGasUsed: number;
    gasUsed: number;
};

const sendTransaction = async (web3: Web3, privateKey: string, toAddress: string, amount: string):
    Promise<{ txHash: string, receipt: TransactionReceipt }> => {

    const account = web3.eth.accounts.privateKeyToAccount(formatPrivateKey(web3, privateKey));

    const tx = {
        from: account.address,
        to: toAddress,
        value: web3.utils.toWei(amount, 'ether'),
        gas: 21000,
        gasPrice: web3.utils.toWei('20', 'gwei')
    };

    return new Promise<{ sender: string, txHash: string, receipt: TransactionReceipt }>(async (resolve, reject) => {
        try {
            const signedTx = await account.signTransaction(tx);
            web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                .once('transactionHash', (hash: string) => {
                    console.log(`Transaction hash: ${hash}`);
                })
                .once('receipt', (receipt: TransactionReceipt) => {
                    resolve({ sender: account.address, txHash: receipt.transactionHash, receipt });
                })
                .on('error', (error) => {
                    reject(error);
                });
        } catch (error) {
            reject(error);
        }
    });
};

export default sendTransaction;
