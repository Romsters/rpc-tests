require("dotenv").config();
import Web3 from "web3";
import BN from "bn.js";
import { describe, expect } from "@jest/globals";
import { formatPrivateKey } from "../../../utils/web3utils";
import sendTransaction from "./index";

const { RPC_URL, SEND_FROM_PK, SEND_TO_ADDRESS, SEND_AMOUNT } = process.env;

const provider = new Web3.providers.HttpProvider(RPC_URL);
const web3 = new Web3(provider);

describe("web3_sendTransaction", () => {

    if (!SEND_FROM_PK) {
        throw new Error("SEND_FROM_PK is missing from the environment variables. Please set it in the .env file.");
    }

    it("Sends a transaction from EOA to EOA and confirms balance change.", async () => {

        // Get the initial balances of both addresses BEFORE the transaction
        const initialSenderBalance = await web3.eth.getBalance(
            web3.eth.accounts.privateKeyToAccount(formatPrivateKey(web3, SEND_FROM_PK)).address);

        const initialReceiverBalance = await web3.eth.getBalance(SEND_TO_ADDRESS);

        // Send the transaction
        const { sender, txHash, receipt } = await sendTransaction(
            web3,
            SEND_FROM_PK,
            SEND_TO_ADDRESS,
            SEND_AMOUNT
        );

        // Validate initial tx hash format and compare to tx receipt tx hash.
        expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(receipt.transactionHash).toBe(txHash);

        // Get the balances of both addresses again AFTER the transaction
        const newSenderBalance = await web3.eth.getBalance(sender);
        const newReceiverBalance = await web3.eth.getBalance(SEND_TO_ADDRESS);

        // Confirm the difference in the sender's balance
        const transactionCost = new BN(initialSenderBalance).sub(new BN(newSenderBalance));
        // TODO consider using estimateGas instead of hardcoding 20 gwei.
        const gasCost = new BN(receipt.gasUsed).mul(new BN(web3.utils.toWei('20', 'gwei')));
        const totalSentAmount = new BN(web3.utils.toWei(SEND_AMOUNT, 'ether')).add(gasCost);
        expect(transactionCost.toString()).toBe(totalSentAmount.toString());

        // Confirm the difference in the receiver's balance
        const amountReceivedInWei = web3.utils.toWei(SEND_AMOUNT, 'ether');
        expect(new BN(newReceiverBalance).sub(new BN(initialReceiverBalance)).toString()).toBe(amountReceivedInWei);
    }, 60000, { tags: 'transaction'});
});

