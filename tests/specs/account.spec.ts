import { AptosAccount, CoinClient } from "aptos";

import { TransactionSigner } from "../../client/transaction.client";
import { TransactionBuilder } from "../../client/transaction.builder";
import { AptosBootingManager } from "../aptos-node/aptos.boot";

const aptosNode = AptosBootingManager.getInstance();

describe("account]", function () {
  let signer: TransactionSigner;
  let txBuilder: TransactionBuilder;
  let coinClient: CoinClient;
  let account: AptosAccount;

  beforeAll(async () => {
    account = await aptosNode.createAndFundAccount();

    // build up transaction signer and tx builder
    signer = new TransactionSigner(
      account.toPrivateKeyObject().privateKeyHex,
      AptosBootingManager.APTOS_NODE_URL
    );

    coinClient = new CoinClient(signer.getClient());

    txBuilder = new TransactionBuilder(signer, null);
  });

  it("[account] should: resource account is known-able and creatable", async () => {
    // can predict the resource account address
    const resourceAccountAddress = AptosAccount.getResourceAccountAddress(
      account.address().hex(),
      new TextEncoder().encode("hamsterpocket")
    ).hex();

    // now we create resource account
    await txBuilder
      .buildCreateResourceAccountTransaction({
        seed: "hamsterpocket",
        ownerAddress: signer.getAddress().hex(),
        amountToFund: BigInt(1e7),
      })
      .execute();

    // make sure the resource was created properly
    expect(await coinClient.checkBalance(resourceAccountAddress)).toEqual(
      BigInt(1e7)
    );
  });
});
