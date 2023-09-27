import fetchAPI from "../../../utils/fetchAPI";
import { JSONRPC } from "../../../utils/types";
import fixtures from "../../../fixtures";

const eth_getTransactionByHash = async (txHash?: string):
    Promise<JSONRPC> => await fetchAPI({
    options: {
        id: fixtures.id,
        jsonrpc: fixtures.jsonrpc,
        method: "eth_getTransactionByHash",
        params: [txHash || process.env.TX_HASH],
    },
});

export default eth_getTransactionByHash;
