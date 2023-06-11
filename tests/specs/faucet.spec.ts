import { AptosClient } from "aptos";
import { AptosBootingManager } from "../aptos-node/aptos.boot";

describe("faucet", function () {
  it("[faucet]: faucet should work properly", async () => {
    const aptosCoin = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
    const client = new AptosClient(AptosBootingManager.APTOS_NODE_URL);

    const resources = await client.getAccountResources(
      AptosBootingManager.MAIN_ACCOUNT_ADDRESS
    );
    const accountResource = resources.find((r) => r.type === aptosCoin);

    expect(
      Number((accountResource!.data as { coin: { value: string } }).coin.value)
    ).toBeGreaterThan(0);
  });
});
