import { AptosAccount } from "aptos";

import { TransactionSigner } from "../client/transaction.client";
import { TransactionBuilder } from "../client/transaction.builder";
import { AptosBootingManager } from "../aptos-node/aptos.boot";
import {
  AMM,
  AutoCloseConditionClosedWith,
  OpenPositionOperator,
  PocketStatus,
  StopConditionStoppedWith,
  transformPocketEntity,
} from "../client/entities/pocket.entity";
import { CreatePocketParams } from "../client/params.type";

describe("manage_pocket", function () {
  let signer: TransactionSigner;
  let txBuilder: TransactionBuilder;

  const pocketData: CreatePocketParams = {
    id: "testpocketdata",
    amm: AMM.PCS,
    baseTokenAddress:
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa",
    targetTokenAddress:
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa",
    batchVolume: BigInt(1000),
    frequency: BigInt(3600),
    startAt: BigInt(parseInt((new Date().getTime() / 1000).toString())),
    openPositionConditionValueX: BigInt(0),
    openPositionConditionValueY: BigInt(0),
    openPositionConditionOperator: OpenPositionOperator.UNSET,
    stopLossConditionStoppedValue: BigInt(0),
    stopLossConditionStoppedWith: StopConditionStoppedWith.UNSET,
    takeProfitConditionStoppedValue: BigInt(0),
    takeProfitConditionStoppedWith: StopConditionStoppedWith.UNSET,
    autoCloseConditionValue: BigInt(0),
    autoCloseConditionClosedWith: AutoCloseConditionClosedWith.UNSET,
  };

  beforeAll(async () => {
    /**
     * @dev create new account
     */
    const aptosAccount = new AptosAccount();

    /**
     * @dev funding account
     */
    await AptosBootingManager.getInstance().fundingWithFaucet(
      aptosAccount.address().hex()
    );

    /**
     * @dev build signer and tx builder
     */
    signer = new TransactionSigner(
      aptosAccount.toPrivateKeyObject().privateKeyHex,
      AptosBootingManager.APTOS_NODE_URL
    );
    txBuilder = new TransactionBuilder(signer);

    /**
     * @dev Build admin tx builder
     */
    const adminTxBuilder = new TransactionBuilder(
      new TransactionSigner(
        AptosBootingManager.PRIVATE_KEY,
        AptosBootingManager.APTOS_NODE_URL
      )
    );

    /**
     * @dev Whitelist target first
     */
    await adminTxBuilder
      .buildSetInteractiveTargetTransaction({
        target:
          "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa",
        value: true,
      })
      .execute();
  });

  it("[manage_pocket] should: create pocket successfully", async () => {
    // create pocket
    await txBuilder.buildCreatePocketTransaction(pocketData).execute();

    // fetch pocket
    const [pocketResponse] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    const transformedPocket = transformPocketEntity(pocketResponse);

    // expect
    expect(transformedPocket.id).toEqual(pocketData.id);
    expect(transformedPocket.owner).toEqual(
      signer.getAddress().toShortString()
    );
    expect(transformedPocket.start_at).toEqual(
      transformedPocket.next_scheduled_execution_at
    );
    expect(transformedPocket.start_at).toEqual(pocketData.startAt);
    expect(transformedPocket.status).toEqual(PocketStatus.STATUS_ACTIVE);
  });

  it("[manage_pocket] should: can pause pocket", async () => {
    // pause pocket
    await txBuilder
      .buildPausePocketTransaction({ id: pocketData.id })
      .execute();

    // fetch pocket
    const [pocketResponse] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    const transformedPocket = transformPocketEntity(pocketResponse);

    // expect
    expect(transformedPocket.id).toEqual(pocketData.id);
    expect(transformedPocket.status).toEqual(PocketStatus.STATUS_PAUSED);
  });

  it("[manage_pocket] should: can restart pocket", async () => {
    // pause pocket
    await txBuilder
      .buildRestartPocketTransaction({ id: pocketData.id })
      .execute();

    // fetch pocket
    const [pocketResponse] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    const transformedPocket = transformPocketEntity(pocketResponse);

    // expect
    expect(transformedPocket.id).toEqual(pocketData.id);
    expect(transformedPocket.status).toEqual(PocketStatus.STATUS_ACTIVE);
  });

  it("[manage_pocket] should: can close pocket", async () => {
    // pause pocket
    await txBuilder
      .buildClosePocketTransaction({ id: pocketData.id })
      .execute();

    // fetch pocket
    const [pocketResponse] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    const transformedPocket = transformPocketEntity(pocketResponse);

    // expect
    expect(transformedPocket.id).toEqual(pocketData.id);
    expect(transformedPocket.status).toEqual(PocketStatus.STATUS_CLOSED);
  });
});
