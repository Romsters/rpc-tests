require("dotenv").config();
import Web3 from "web3";
import BN from "bn.js";
import {Contract} from "web3-eth-contract";
import { describe, expect } from "@jest/globals";
import {formatPrivateKey, isValidEthereumAddress} from "../../../utils/web3utils";
import {
    addLiquidity,
    approve,
    deployFactory,
    deployRouter,
    deployTokenContracts,
    deployWeth,
    getTokenBalance,
} from "./index";
import Router from "../../../node_modules/@uniswap/v2-periphery/build/UniswapV2Router02.json";
import ERC20 from "../../../node_modules/@openzeppelin/contracts/build/contracts/ERC20PresetFixedSupply.json";
import WETH from "../../../node_modules/canonical-weth/build/contracts/WETH9.json";

const { RPC_URL, SEND_FROM_PK } = process.env;
const provider = new Web3.providers.HttpProvider(RPC_URL);
const web3 = new Web3(provider);

describe("Contract Deployment & Interaction", () => {

    if (!SEND_FROM_PK) {
        throw new Error("SEND_FROM_PK is missing from the environment variables. Please set it in the .env file.");
    }

    it("Deploys UniSwap and associated contracts, adds liquidity and performs a token swap", async () => {

        const account = web3.eth.accounts.privateKeyToAccount(formatPrivateKey(web3, SEND_FROM_PK));
        web3.eth.accounts.wallet.add(account);

        // Deploy WETH Contract
        const wethAddress = await deployWeth(web3, account.address);
        expect(isValidEthereumAddress(wethAddress)).toBeTruthy();

        const weth = new web3.eth.Contract(WETH.abi, wethAddress);

        // Deploy UniSwap Factory Contract
        const factoryAddress = await deployFactory(web3, account.address);
        expect(isValidEthereumAddress(factoryAddress)).toBeTruthy();

        // Deploy UniSwap Router Contract
        const routerAddress = await deployRouter(web3, factoryAddress, wethAddress, account.address);
        expect(isValidEthereumAddress(routerAddress)).toBeTruthy();

        const router = new web3.eth.Contract(Router.abi, routerAddress);

        // Deploy 2 ERC20 Contracts
        const [tokenAAddress, tokenBAddress] = await deployTokenContracts(web3, account.address);
        expect(isValidEthereumAddress(tokenAAddress)).toBeTruthy();
        expect(isValidEthereumAddress(tokenBAddress)).toBeTruthy();

        // Confirm ERC20 Balance
        const balanceA = await getTokenBalance(web3, tokenAAddress, account.address)
        const balanceB = await getTokenBalance(web3, tokenAAddress, account.address)

        expect(balanceA.toString()).toEqual("9999999999999999999");
        expect(balanceB.toString()).toEqual("9999999999999999999");

        // before calling addLiquidity we need to approve the Router
        // we need to approve at least amountADesired and amountBDesired
        const spender = router.options.address;
        const tokenA = new web3.eth.Contract(ERC20.abi, tokenAAddress);
        const tokenB = new web3.eth.Contract(ERC20.abi, tokenBAddress);
        const amountA = "1000000000";
        const amountB = "1000000000";

        await approveAndCheck(web3, tokenA, spender, amountA, account.address);
        console.log("Successfully called approve for tokenA/spender")
        await approveAndCheck(web3, tokenB, spender, amountB, account.address);
        console.log("Successfully called approve for tokenB/spender")
        await approveAndCheck(web3, weth, wethAddress, amountA, account.address);
        console.log("Successfully called approve for weth/wethAddress")
        await approveAndCheck(web3, weth, spender, amountA, account.address);
        console.log("Successfully called approve for weth/spender")

        // deadline
        const time = Math.floor(Date.now() / 1000) + 200000;
        const deadline = new BN(time);
        const deadlineString = deadline.toString();

        // Add Liquidity
        const { transactionHash, receipt } = await addLiquidity(
            web3,
            router,
            tokenAAddress,
            tokenBAddress,
            "1000000000",
            "1000000000",
            "0",
            "0",
            account.address,
            deadlineString
        );

        expect(transactionHash).toBeDefined();
        expect(receipt).toBeTruthy();
        expect(Number(receipt.status)).toBe(1);
        expect(receipt).toHaveProperty('transactionHash', transactionHash);
    }, 3600000, { tags: 'transaction'});
});

const approveAndCheck = async (web3: Web3, token: Contract<any>, spender: string, amount: string, sender: string) => {
    const { transactionHash, receipt } = await approve(web3, token, spender, amount, sender);

    expect(transactionHash).toBeDefined();
    expect(receipt).toBeTruthy();
    expect(receipt).toHaveProperty('transactionHash', transactionHash);
    expect(Number(receipt.status)).toBe(1);
    // @ts-ignore
    const currentAllowance = await token.methods.allowance(sender, spender).call();
    expect(currentAllowance.toString()).toEqual(amount);
};


