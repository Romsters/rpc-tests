require("dotenv").config();
import Web3 from "web3";
import BN from "bn.js";
import { describe, expect } from "@jest/globals";
import {formatPrivateKey, isValidEthereumAddress} from "../../../utils/web3utils";
import {deployFactory, deployRouter, deployTokenContracts, deployWeth, getTokenBalance, transferTokens} from "./index";
import Factory from "../../../node_modules/@uniswap/v2-core/build/UniswapV2Factory.json";
import Router from "../../../node_modules/@uniswap/v2-periphery/build/UniswapV2Router02.json";
import ERC20 from "../../../node_modules/@openzeppelin/contracts/build/contracts/ERC20PresetFixedSupply.json";
import Pair from "../../../node_modules/@uniswap/v2-core/build/UniswapV2Pair.json";
import WETH from "../../../node_modules/canonical-weth/build/contracts/WETH9.json";

const { RPC_URL, SEND_FROM_PK, SEND_TO_ADDRESS, SEND_AMOUNT } = process.env;
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

        const factory = new web3.eth.Contract(Factory.abi, factoryAddress);

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

    }, 1800000);
});

