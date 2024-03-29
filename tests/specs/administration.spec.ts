import { AptosAccount } from "aptos";

import { TransactionSigner } from "../../client/transaction.client";
import { TransactionBuilder } from "../../client/transaction.builder";
import { AptosBootingManager } from "../aptos-node/aptos.boot";
import { EventIndexer } from "../../client/events.indexer";

const aptosLocalNodeProcess = AptosBootingManager.getInstance();

describe("administration", function () {
  let signer: TransactionSigner;
  let txBuilder: TransactionBuilder;
  let eventIndexer: EventIndexer;

  beforeAll(async () => {
    const account = aptosLocalNodeProcess.getDeployerAccount();
    signer = new TransactionSigner(
      account.toPrivateKeyObject().privateKeyHex,
      AptosBootingManager.APTOS_NODE_URL
    );

    txBuilder = new TransactionBuilder(
      signer,
      aptosLocalNodeProcess.resourceAccountAddress
    );

    eventIndexer = new EventIndexer(
      signer.getClient(),
      aptosLocalNodeProcess.resourceAccountAddress
    );
  });

  it("[administration] should: initial states were made properly", async () => {
    const [adminResult] = await txBuilder
      .buildCheckForAllowedAdmin(signer.getAddress().hex())
      .execute();
    expect(adminResult).toEqual(true);

    const [targetResult] = await txBuilder
      .buildCheckForAllowedTarget(signer.getAddress().hex())
      .execute();
    expect(targetResult).toEqual(false);

    const [operatorResult] = await txBuilder
      .buildCheckForAllowedOperator(signer.getAddress().hex())
      .execute();
    expect(operatorResult).toEqual(false);
  });

  it("[administration] should: able to allow operator", async () => {
    /**
     * @dev Submit operator to blockchain
     */
    await txBuilder
      .buildSetOperatorTransaction({
        target: signer.getAddress().hex(),
        value: true,
      })
      .execute();

    const events = await eventIndexer.getUpdateAllowedOperatorEvents({
      start: 0,
      limit: 1000,
    });
    const event = events.pop();
    expect(event?.data.target).toEqual(signer.getAddress().hex());
    expect(event?.data.value).toEqual(true);

    /**
     * @dev Verify on-chain data
     */
    const [result] = await txBuilder
      .buildCheckForAllowedOperator(signer.getAddress().hex())
      .execute();

    expect(result).toEqual(true);
  });

  it("[administration] should: able to allow interactive target", async () => {
    /**
     * @dev Submit operator to blockchain
     */
    await txBuilder
      .buildSetInteractiveTargetTransaction({
        target: signer.getAddress().hex(),
        value: true,
      })
      .execute();

    const events = await eventIndexer.getUpdateAllowedTargetEvents({
      start: 0,
      limit: 1000,
    });
    const event = events.pop();
    expect(event?.data.target).toEqual(signer.getAddress().hex());
    expect(event?.data.value).toEqual(true);

    /**
     * @dev Verify on-chain data
     */
    const [result] = await txBuilder
      .buildCheckForAllowedTarget(signer.getAddress().hex())
      .execute();

    expect(result).toEqual(true);
  });

  it("[administration] should: non-admin will be rejected for administration activities", async () => {
    const nonAdminAccount = await aptosLocalNodeProcess.createAndFundAccount();
    expect(nonAdminAccount.address().toShortString()).not.toEqual(
      aptosLocalNodeProcess.getDeployerAccount().address().hex()
    );

    // signer and tx builder
    const transactionSigner = new TransactionSigner(
      nonAdminAccount.toPrivateKeyObject().privateKeyHex,
      AptosBootingManager.APTOS_NODE_URL
    );
    const transactionBuilder = new TransactionBuilder(
      transactionSigner,
      aptosLocalNodeProcess.resourceAccountAddress
    );

    // try for admin
    try {
      await transactionBuilder
        .buildSetOperatorTransaction({
          target: nonAdminAccount.address().hex(),
          value: true,
        })
        .execute();

      throw new Error("should be failed");
    } catch (e) {
      expect((e as any).message.includes("0x50000")).toEqual(true);
    }

    try {
      await transactionBuilder
        .buildSetInteractiveTargetTransaction({
          target: nonAdminAccount.address().hex(),
          value: true,
        })
        .execute();

      throw new Error("should be failed");
    } catch (e) {
      expect((e as any).message.includes("0x50000")).toEqual(true);
    }
  });

  it("[administration] should: able to transfer admin", async () => {
    const account = new AptosAccount();

    /**
     * @dev Submit operator to blockchain
     */
    await txBuilder
      .buildTransferAdminTransaction({
        target: account.address().toString(),
      })
      .execute();

    const events = await eventIndexer.getUpdateAllowedAdminEvents({
      start: 0,
      limit: 1000,
    });
    const event2 = events.pop();
    const event1 = events.pop();
    expect(event1?.data.target).toEqual(signer.getAddress().hex());
    expect(event1?.data.value).toEqual(false);
    expect(event2?.data.target).toEqual(account.address().hex());
    expect(event2?.data.value).toEqual(true);

    /**
     * @dev Verify on-chain data
     */
    const [result] = await txBuilder
      .buildCheckForAllowedAdmin(signer.getAddress().hex())
      .execute();
    expect(result).toEqual(false);

    /**
     * @dev Verify on-chain data
     */
    const [newAdminResult] = await txBuilder
      .buildCheckForAllowedAdmin(account.address().hex())
      .execute();
    expect(newAdminResult).toEqual(true);
  });
});
