import { TransactionSigner } from "../client/transaction.client";
import { TransactionBuilder } from "../client/transaction.builder";
import { AptosBootingManager } from "../aptos-node/aptos.boot";
import {
  AMM,
  AutoCloseConditionClosedWith,
  CreatePocketParams,
  OpenPositionOperator,
  StopConditionStoppedWith,
} from "../client/params.type";
import { transformPocketEntity } from "../client/entities/pocket.entity";

describe("[manage_pocket]", function () {
  let signer: TransactionSigner;
  let txBuilder: TransactionBuilder;

  beforeAll(async () => {
    signer = new TransactionSigner(
      AptosBootingManager.PRIVATE_KEY,
      AptosBootingManager.APTOS_NODE_URL
    );

    txBuilder = new TransactionBuilder(signer);

    /**
     * @dev Whitelist target first
     */
    await txBuilder
      .buildSetInteractiveTargetTransaction(
        "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa",
        true
      )
      .execute();
  });

  it("[manage_pocket] should: create pocket successfully", async () => {
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

    // create pocket
    await txBuilder.buildCreatePocketTransaction(pocketData).execute();

    const [pocketResponse] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    const transformedPocket = transformPocketEntity(pocketResponse);

    expect(transformedPocket.id).toEqual(pocketData.id);
  });
});
