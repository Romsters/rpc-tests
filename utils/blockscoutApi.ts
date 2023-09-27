import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function getLatestTxHash(): Promise<string | null> {
    const API_ENDPOINT = `${process.env.BLOCKSCOUT_API}/txs?page_number=1&page_size=1&pages_limit=1&type=JSON`;

    try {
        const response = await axios.get(API_ENDPOINT);
        const data = response.data;

        if (data.items && data.items.length > 0) {
            const regex = /data-identifier-hash="(0x[a-fA-F0-9]{64})"/;
            const match = (data.items[0] as string).match(regex);

            if (match && match[1]) {
                return match[1];
            }
        } else {
            throw new Error("No data returned by Blockscout API, unable to get latest tx hash.")
        }
    } catch (error) {
        throw new Error(`Failed to fetch data from Blockscout API: ${error.message}`);
    }
}
