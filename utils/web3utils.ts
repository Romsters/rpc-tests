import { Web3 } from "web3";

export const formatPrivateKey = (web3: Web3, privateKey: string): string => {
    return privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
}