import Web3 from "web3";
import Factory from "../../../node_modules/@uniswap/v2-core/build/UniswapV2Factory.json";
import Router from "../../../node_modules/@uniswap/v2-periphery/build/UniswapV2Router02.json";
import ERC20 from "../../../node_modules/@openzeppelin/contracts/build/contracts/ERC20PresetFixedSupply.json";
import Pair from "../../../node_modules/@uniswap/v2-core/build/UniswapV2Pair.json";
import WETH from "../../../node_modules/canonical-weth/build/contracts/WETH9.json";
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
        .send({ from: sender, gas: GasLimit, gasPrice: GasPrice });

    console.log("router address", router.options.address);

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
    tokenAddress: string,
    spender: string,
    amount: string,
    sender: string
): Promise<{transactionHash?: string, receipt?: any}> => {
    const tokenContract = new web3.eth.Contract(ERC20.abi as any, tokenAddress);

    let transactionHash: string | undefined;
    let receipt: any;

    // @ts-ignore
    await tokenContract.methods
        .approve(spender, amount)
        .send({ from: sender, gas: GasLimit, gasPrice: GasPrice })
        .on("transactionHash", function (hash) {
            console.log(sender + ": transaction hash", hash);
            transactionHash = hash;
        })
        .on("receipt", function (rec) {
            receipt = rec;
        });

    return { transactionHash, receipt };
}

interface TransferResult {
    recipient: string;
    transactionHash?: string;
    receipt?: any;
}

export const transferTokens = async (
    web3: Web3,
    tokenContractAddress: string,
    amount: string,
    sender: string
): Promise<TransferResult> => {
    const tokenContract = new web3.eth.Contract(ERC20.abi as any, tokenContractAddress);

    let transactionHash: string | undefined;
    let receipt: any;

    // @ts-ignore
    const estimatedGas = await tokenContract.methods
        .transfer(sender, amount)
        .estimateGas({ from: sender });

    // @ts-ignore
    await tokenContract.methods
        .transfer(sender, amount)
        .send({ from: sender, gas: estimatedGas })
        .on("transactionHash", function (hash) {
            console.log(sender + " transaction hash", hash);
            transactionHash = hash;
        })
        .on("receipt", function (rec) {
            console.log(sender + " receipt", rec);
            receipt = rec;
        });

    return { recipient: sender, transactionHash, receipt };
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
