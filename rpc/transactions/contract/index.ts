import Web3 from "web3";
import Factory from "../../../node_modules/@uniswap/v2-core/build/UniswapV2Factory.json";
import Router from "../../../node_modules/@uniswap/v2-periphery/build/UniswapV2Router02.json";
import ERC20 from "../../../node_modules/@openzeppelin/contracts/build/contracts/ERC20PresetFixedSupply.json";
import Pair from "../../../node_modules/@uniswap/v2-core/build/UniswapV2Pair.json";
import WETH from "../../../node_modules/canonical-weth/build/contracts/WETH9.json";
import { Contract } from "web3-eth-contract"
import {getCurrentDateTokens} from "../../../utils/web3utils";

export const deployWeth: (web3: Web3, sender: string) => Promise<string | undefined> = async (web3, sender) => {
        const wethContract = new web3.eth.Contract(WETH.abi as any);

        const estimatedGas = await wethContract
            .deploy({ data: WETH.bytecode })
            .estimateGas({ from: sender });

        const deployedWeth = await wethContract
            .deploy({ data: WETH.bytecode })
            .send({ from: sender, gas: estimatedGas });

        console.log("WETH deployed at:", deployedWeth.options.address);

        return deployedWeth.options.address;
};

export const deployTokenContracts: (web3: Web3, sender: string) =>
    Promise<[string, string] | undefined> = async (web3, sender) => {

    let tokenA = new web3.eth.Contract(ERC20.abi);
    let tokenB = new web3.eth.Contract(ERC20.abi);

    const { fullName: fullNameA, shortName: shortNameA } = getCurrentDateTokens("tokenA", "TA");
    const { fullName: fullNameB, shortName: shortNameB } = getCurrentDateTokens("tokenB", "TB");

    // @ts-ignore
    const estimatedGas = await tokenA
        .deploy({
            data: ERC20.bytecode,
            arguments: [
                fullNameA,
                shortNameA,
                "9999999999999999999",
                sender
            ]
        })
        .estimateGas();

    // @ts-ignore
    tokenA = await tokenA
        .deploy({
            data: ERC20.bytecode,
            arguments: [
                fullNameA,
                shortNameA,
                "9999999999999999999",
                sender
            ]
        })
        .send({ from: sender, gas: estimatedGas });

    console.log("tokenA address: ", tokenA.options.address);

    // @ts-ignore
    tokenB = await tokenB
        .deploy({
            data: ERC20.bytecode,
            arguments: [
                fullNameB,
                shortNameB,
                "9999999999999999999",
                sender,
            ],
        })
        .send({ from: sender, gas: estimatedGas });

    console.log("tokenB address: ", tokenB.options.address);

    return [tokenA.options.address, tokenB.options.address];
};

export const deployRouter = async ( web3: Web3, factoryAddress: string, wethAddress: string, sender: string ): Promise<string | undefined> => {
    let router = new web3.eth.Contract(Router.abi);

    // @ts-ignore
    const estimatedGas = await router
        .deploy({ data: Router.bytecode, arguments: [factoryAddress, wethAddress] })
        .estimateGas({ from: sender });

    // @ts-ignore
    router = await router
        .deploy({ data: Router.bytecode, arguments: [factoryAddress, wethAddress] })
        .send({ from: sender, gas: estimatedGas });

    console.log("Router address", router.options.address);

    return router.options.address;
}

export const deployFactory = async (web3: Web3, sender: string): Promise<string | undefined> => {
    let factory = new web3.eth.Contract(Factory.abi);

    // @ts-ignore
    const estimatedGas = await factory
        .deploy({ data: Factory.bytecode, arguments: [sender] })
        .estimateGas({ from: sender });

    // @ts-ignore
    factory = await factory
        .deploy({ data: Factory.bytecode, arguments: [sender] })
        .send({ from: sender, gas: estimatedGas });

    console.log("UniSwap Factory address: ", factory.options.address);

    return factory.options.address;
}

export const approve = async (
    web3: Web3,
    tokenContract: Contract<any>,
    spender: string,
    amount: string,
    sender: string
): Promise<{transactionHash?: string, receipt?: any}> => {
    let estimatedGas;

    try {
        // @ts-ignore
        estimatedGas = await tokenContract.methods
            .approve(spender, amount)
            .estimateGas({ from: sender });

        console.log("Estimated Gas:", estimatedGas);
    } catch (error) {
        console.error("Error estimating gas:", error);
        throw error;
    }

    const nonce = await web3.eth.getTransactionCount(sender);
    const gasPrice = await web3.eth.getGasPrice();

    // @ts-ignore
    const tx = {
        to: tokenContract.options.address,
        data: tokenContract.methods.approve(spender, amount).encodeABI(),
        gas: estimatedGas,
        gasPrice: web3.utils.toHex(gasPrice),
        nonce: web3.utils.toHex(nonce),
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.SEND_FROM_PK);

    const transactionHashPromise = new Promise<string>((resolve, reject) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction!)
            .on('transactionHash', function (hash) {
                resolve(hash.toString());
            })
            .on('error', reject);
    });

    const receiptPromise = new Promise<any>((resolve, reject) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction!)
            .on('receipt', function (rec) {
                resolve(rec);
            })
            .on('error', reject);
    });

    try {
        const [transactionHash, receipt] = await Promise.all([transactionHashPromise, receiptPromise]);
        return { transactionHash, receipt };
    } catch (error) {
        console.error("Error sending transaction:", error);
        throw error;
    }
}

export const addLiquidity = async (
    web3: Web3,
    routerContract: Contract<any>,
    tokenAAddress: string,
    tokenBAddress: string,
    amountADesired: string,
    amountBDesired: string,
    amountAMin: string,
    amountBMin: string,
    sender: string,
    deadline: string
): Promise<{transactionHash?: string, receipt?: any}> => {
    let estimatedGas;

    try {
        // @ts-ignore
        estimatedGas = await routerContract.methods
            .addLiquidity(
                tokenAAddress,
                tokenBAddress,
                amountADesired,
                amountBDesired,
                amountAMin,
                amountBMin,
                sender,
                deadline
            )
            .estimateGas({ from: sender });

        console.log("Estimated Gas:", estimatedGas);
    } catch (error) {
        console.error("Error estimating gas:", error);
        throw error;
    }

    const nonce = await web3.eth.getTransactionCount(sender);
    const gasPrice = await web3.eth.getGasPrice();

    // @ts-ignore
    const tx = {
        to: routerContract.options.address,
        data: routerContract.methods.addLiquidity(
            tokenAAddress,
            tokenBAddress,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            sender,
            deadline
        ).encodeABI(),
        gas: estimatedGas,
        gasPrice: web3.utils.toHex(gasPrice),
        nonce: web3.utils.toHex(nonce),
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.SEND_FROM_PK);

    const transactionHashPromise = new Promise<string>((resolve, reject) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction!)
            .on('transactionHash', function (hash) {
                resolve(hash.toString());
            })
            .on('error', reject);
    });

    const receiptPromise = new Promise<any>((resolve, reject) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction!)
            .on('receipt', function (rec) {
                resolve(rec);
            })
            .on('error', reject);
    });

    try {
        const [transactionHash, receipt] = await Promise.all([transactionHashPromise, receiptPromise]);
        return { transactionHash, receipt };
    } catch (error) {
        console.error("Error sending transaction:", error);
        throw error;
    }
}

export const getTokenBalance = async (
    web3: Web3,
    tokenContractAddress: string,
    accountAddress: string
): Promise<string> => {
    const tokenContract = new web3.eth.Contract(ERC20.abi as any, tokenContractAddress);

    // @ts-ignore
    return await tokenContract.methods.balanceOf(accountAddress).call();
}
