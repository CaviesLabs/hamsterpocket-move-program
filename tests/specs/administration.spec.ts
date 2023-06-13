import { TransactionSigner } from "../client/transaction.client";
import { TransactionBuilder } from "../client/transaction.builder";
import { AptosBootingManager } from "../aptos-node/aptos.boot";

describe("administration", function () {
  let signer: TransactionSigner;
  let txBuilder: TransactionBuilder;

  beforeAll(async () => {
    signer = new TransactionSigner(
      AptosBootingManager.PRIVATE_KEY,
      AptosBootingManager.APTOS_NODE_URL
    );

    txBuilder = new TransactionBuilder();
  });

  it("[administration] should: initial admin has been already added", async () => {
    const [result] = await signer.view(
      txBuilder.buildCheckForAllowedAdmin(signer.getAddress().hex())
    );

    expect(result).toEqual(true);
  });
});
