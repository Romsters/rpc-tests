import { describe } from "@jest/globals";
import eth_getUncleByBlockNumberAndIndex from "./index";
import evaluateResponse from "../../../utils/evaluateResponse";

describe.skip("eth_getUncleByBlockNumberAndIndex", () => {
  it("Returns the uncle by block number and index.", async () => {
    evaluateResponse({
      response: await eth_getUncleByBlockNumberAndIndex(),
      pattern: null,
      expectNullResult: true,
    });
  });
});
