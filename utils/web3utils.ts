import { Web3 } from "web3";

export const formatPrivateKey = (web3: Web3, privateKey: string): string => {
    return privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
}

export const isValidEthereumAddress = (address: string): boolean => {
    const ethereumAddressPattern = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressPattern.test(address);
}

export const getCurrentDateTokens = (baseName: string, abbreviation: string): { fullName: string, shortName: string } => {
    const today = new Date();

    const day = today.getUTCDate() < 10 ? "0" + today.getUTCDate() : today.getUTCDate().toString();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[today.getUTCMonth()];
    const year = today.getUTCFullYear().toString();

    const fullName = `${baseName}_${day}${month}${year}`;
    const shortName = `${abbreviation}_${day}${month}${year}`;

    return { fullName, shortName };
}
