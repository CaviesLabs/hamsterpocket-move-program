import { AptosClient } from "aptos";
import { AptosBootingManager } from "../aptos-node/aptos.boot";

describe("deployment", function () {
  it("[deployment]: program should be deployed successfully", async () => {
    const packageResource = "0x1::code::PackageRegistry";
    const client = new AptosClient(AptosBootingManager.APTOS_NODE_URL);

    const resources = await client.getAccountResources(
      AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS
    );
    const accountResource = resources.find((r) => r.type === packageResource);

    expect(
      ((accountResource.data as any).packages as { name: string }[])[0].name
    ).toEqual("hamsterpocket");
  });
});
