import { TransactionSigner } from "../../client/transaction.client";
import { TransactionBuilder } from "../../client/transaction.builder";
import { AptosBootingManager } from "../aptos-node/aptos.boot";
import {
  AMM,
  AutoCloseConditionClosedWith,
  OpenPositionOperator,
  PocketStatus,
  StopConditionStoppedWith,
  transformPocketEntity,
} from "../../client/entities/pocket.entity";
import { CreatePocketParams } from "../../client/params.type";
import { EventIndexer } from "../../client/events.indexer";

const aptosNode = AptosBootingManager.getInstance();

describe("manage_pocket", function () {
  let signer: TransactionSigner;
  let txBuilder: TransactionBuilder;
  let eventIndexer: EventIndexer;

  const pocketData: CreatePocketParams = {
    id: "testpocketdata",
    amm: AMM.PCS,
    baseCoinType: "0x1::aptos_coin::AptosCoin",
    targetCoinType: "0x1::aptos_coin::AptosCoin",
    batchVolume: BigInt(1000),
    frequency: BigInt(3600),
    startAt: BigInt(parseInt((new Date().getTime() / 1000).toString())),
    openPositionCondition: [OpenPositionOperator.UNSET, BigInt(0), BigInt(0)],
    stopLossCondition: [StopConditionStoppedWith.UNSET, BigInt(0)],
    takeProfitCondition: [StopConditionStoppedWith.UNSET, BigInt(0)],
    autoClosedConditions: [
      [AutoCloseConditionClosedWith.CLOSED_WITH_END_TIME, BigInt(13)],
    ],
  };

  beforeAll(async () => {
    /**
     * @dev create new account
     */
    const aptosAccount = await aptosNode.createAndFundAccount();

    /**
     * @dev build signer and tx builder
     */
    signer = new TransactionSigner(
      aptosAccount.toPrivateKeyObject().privateKeyHex,
      AptosBootingManager.APTOS_NODE_URL
    );
    txBuilder = new TransactionBuilder(
      signer,
      aptosNode.resourceAccountAddress
    );
    eventIndexer = new EventIndexer(
      signer.getClient(),
      aptosNode.resourceAccountAddress
    );

    /**
     * @dev Build admin tx builder
     */
    const adminTxBuilder = new TransactionBuilder(
      new TransactionSigner(
        aptosNode.getDeployerAccount().toPrivateKeyObject().privateKeyHex,
        AptosBootingManager.APTOS_NODE_URL
      ),
      aptosNode.resourceAccountAddress
    );

    /**
     * @dev Whitelist target first
     */
    await adminTxBuilder
      .buildSetInteractiveTargetTransaction({
        target: "0x1::aptos_coin::AptosCoin",
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
    expect(transformedPocket.open_position_condition.operator).toEqual(
      OpenPositionOperator.UNSET
    );
    expect(transformedPocket.open_position_condition.value_x).toEqual(
      BigInt(0)
    );
    expect(transformedPocket.open_position_condition.value_x).toEqual(
      BigInt(0)
    );
    expect(transformedPocket.auto_close_conditions.length).toEqual(1);
    expect(transformedPocket.auto_close_conditions[0].closed_with).toEqual(
      AutoCloseConditionClosedWith.CLOSED_WITH_END_TIME
    );
    expect(transformedPocket.auto_close_conditions[0].value).toEqual(
      BigInt(13)
    );

    // check for event
    const [event] = await eventIndexer.getCreatePocketEvents({
      start: 0,
      limit: 1,
    });
    expect(event.data.pocket.id).toEqual(pocketData.id);
  });

  it("[manage_pocket] should: update pocket successfully", async () => {
    // create pocket
    await txBuilder
      .buildUpdatePocketTransaction({
        ...pocketData,
        openPositionCondition: [
          OpenPositionOperator.OPERATOR_GTE,
          BigInt(1),
          BigInt(10),
        ],
        autoClosedConditions: [],
      })
      .execute();

    // fetch pocket
    const [pocketResponse] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    const transformedPocket = transformPocketEntity(pocketResponse);

    // expect
    expect(transformedPocket.id).toEqual(pocketData.id);
    expect(transformedPocket.open_position_condition.operator).toEqual(
      OpenPositionOperator.OPERATOR_GTE
    );
    expect(transformedPocket.open_position_condition.value_x).toEqual(
      BigInt(1)
    );
    expect(transformedPocket.open_position_condition.value_y).toEqual(
      BigInt(10)
    );
    expect(transformedPocket.auto_close_conditions.length).toEqual(0);

    const [event] = await eventIndexer.getUpdatePocketEvents({
      start: 0,
      limit: 1,
    });
    expect(event.data.pocket.id).toEqual(pocketData.id);
    expect(Number(event.data.pocket.open_position_condition.operator)).toEqual(
      OpenPositionOperator.OPERATOR_GTE
    );
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

    const [event] = await eventIndexer.getUpdatePocketStatusEvents({
      start: 0,
      limit: 1,
    });
    expect(event.data.id).toEqual(pocketData.id);
    expect(Number(event.data.status) as PocketStatus).toEqual(
      PocketStatus.STATUS_PAUSED
    );
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

    const [event] = await eventIndexer.getUpdatePocketStatusEvents({
      start: 1,
      limit: 1,
    });
    expect(event.data.id).toEqual(pocketData.id);
    expect(Number(event.data.status) as PocketStatus).toEqual(
      PocketStatus.STATUS_ACTIVE
    );
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

    const [event] = await eventIndexer.getUpdatePocketStatusEvents({
      start: 2,
      limit: 1,
    });
    expect(event.data.id).toEqual(pocketData.id);
    expect(Number(event.data.status) as PocketStatus).toEqual(
      PocketStatus.STATUS_CLOSED
    );
  });
});
