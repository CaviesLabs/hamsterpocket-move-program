import { CoinClient } from "aptos";

import { TransactionSigner } from "../../client/transaction.client";
import { TransactionBuilder } from "../../client/transaction.builder";
import { CreatePocketParams } from "../../client/params.type";
import {
  AMM,
  AutoCloseConditionClosedWith,
  OpenPositionOperator,
  PocketStatus,
  StopConditionStoppedWith,
  transformPocketEntity,
} from "../../client/entities/pocket.entity";
import { AptosBootingManager } from "../aptos-node/aptos.boot";
import { EventIndexer } from "../../client/events.indexer";

const aptosNode = AptosBootingManager.getInstance();

describe("vault", function () {
  let signer: TransactionSigner;
  let txBuilder: TransactionBuilder;
  let coinClient: CoinClient;
  let eventIndexer: EventIndexer;

  const pocketData: CreatePocketParams = {
    id: "test-vault-pocket-data",
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
    coinClient = new CoinClient(signer.getClient());

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

    /**
     * @dev Create a pocket
     */
    await txBuilder.buildCreatePocketTransaction(pocketData).execute();
  });

  it("[vault] should: can deposit token", async () => {
    /**
     * @dev Check for balance
     */
    const beforeBalance = await coinClient.checkBalance(
      signer.getAddress().hex()
    );
    expect(beforeBalance).toBeGreaterThan(BigInt(0));

    try {
      /**
       * @dev Delegated vault should not be available
       */
      await txBuilder
        .buildGetDelegatedVaultAddress(signer.getAddress().hex())
        .execute();

      throw new Error("should be failed");
    } catch (e) {
      expect(
        ((e as any).message as string).includes("Some(851968)")
      ).toBeTruthy();
    }

    /**
     * @dev Now we deposit to created pocket
     */
    await txBuilder
      .buildDepositTransaction({
        coinType: "0x1::aptos_coin::AptosCoin",
        amount: BigInt(10000),
        id: pocketData.id,
      })
      .execute();

    /**
     * @dev Delegated vault should be appeared
     */
    const [delegatedVault] = await txBuilder
      .buildGetDelegatedVaultAddress(signer.getAddress().hex())
      .execute();
    expect(delegatedVault).toBeTruthy();

    /**
     * @dev Check for balance after deposit
     */
    expect(await coinClient.checkBalance(delegatedVault)).toEqual(
      BigInt(10000)
    );
    expect(
      await coinClient.checkBalance(signer.getAddress().hex())
    ).toBeLessThan(beforeBalance);

    /**
     * @dev Check for pocket stats
     */
    let [untransformedPocket] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    let pocket = transformPocketEntity(untransformedPocket);

    expect(pocket.status).toEqual(PocketStatus.STATUS_ACTIVE);
    expect(pocket.base_coin_balance).toEqual(BigInt(10000));
    expect(pocket.target_coin_balance).toEqual(BigInt(0));
    expect(pocket.total_deposited_base_amount).toEqual(BigInt(10000));

    /**
     * @dev Now we deposit to created pocket
     */
    await txBuilder
      .buildDepositTransaction({
        coinType: "0x1::aptos_coin::AptosCoin",
        amount: BigInt(10000),
        id: pocketData.id,
      })
      .execute();

    [untransformedPocket] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    pocket = transformPocketEntity(untransformedPocket);

    expect(pocket.base_coin_balance).toEqual(BigInt(20000));
    expect(pocket.target_coin_balance).toEqual(BigInt(0));
    expect(pocket.total_deposited_base_amount).toEqual(BigInt(20000));

    // create pocket
    const [event] = await eventIndexer.getUpdateDepositStats({
      start: 0,
      limit: 1,
    });
    expect(event.data.id).toEqual(pocketData.id);
    expect(Number(event.data.amount)).toEqual(10000);
    expect(event.data.coin_type).toEqual("0x1::aptos_coin::AptosCoin");
  });

  it("[vault] should: can close and withdraw token", async () => {
    /**
     * @dev Delegated vault should be appeared
     */
    const [delegatedVault] = await txBuilder
      .buildGetDelegatedVaultAddress(signer.getAddress().hex())
      .execute();
    expect(delegatedVault).toBeTruthy();
    expect(await coinClient.checkBalance(delegatedVault)).toEqual(
      BigInt(10000)
    );

    /**
     * @dev Check for balance
     */
    const beforeBalance = await coinClient.checkBalance(
      signer.getAddress().hex()
    );
    expect(beforeBalance).toBeGreaterThan(BigInt(0));

    /**
     * @dev Now we deposit to created pocket
     */
    await txBuilder
      .buildClosePocketAndWithdrawTransaction(
        {
          id: pocketData.id,
        },
        {
          baseCoinType: "0x1::aptos_coin::AptosCoin",
          targetCoinType: "0x1::aptos_coin::AptosCoin",
          id: pocketData.id,
        }
      )
      .execute();

    /**
     * @dev Check for balance after deposit
     */
    expect(await coinClient.checkBalance(delegatedVault)).toEqual(BigInt(0));
    expect(
      await coinClient.checkBalance(signer.getAddress().hex())
    ).toBeGreaterThan(beforeBalance);

    /**
     * @dev Check for pocket stats
     */
    const [untransformedPocket] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    const pocket = transformPocketEntity(untransformedPocket);

    expect(pocket.status).toEqual(PocketStatus.STATUS_WITHDRAWN);
    expect(pocket.base_coin_balance).toEqual(BigInt(0));
    expect(pocket.target_coin_balance).toEqual(BigInt(0));

    const [event] = await eventIndexer.getUpdateWithdrawalStats({
      start: 0,
      limit: 1,
    });
    expect(event.data.id).toEqual(pocketData.id);
    expect(Number(event.data.base_coin_amount)).toEqual(10000);
    expect(event.data.base_coin_type).toEqual("0x1::aptos_coin::AptosCoin");
    expect(Number(event.data.target_coin_amount)).toEqual(0);
    expect(event.data.target_coin_type).toEqual("0x1::aptos_coin::AptosCoin");
  });

  it("[vault] should: can withdraw token", async () => {
    const pocketId = "test-withdraw-pocket-id";

    await txBuilder
      .buildCreatePocketTransaction({
        ...pocketData,
        id: pocketId,
      })
      .execute();
    await txBuilder
      .buildDepositTransaction({
        coinType: "0x1::aptos_coin::AptosCoin",
        amount: BigInt(10000),
        id: pocketId,
      })
      .execute();
    await txBuilder.buildClosePocketTransaction({ id: pocketId }).execute();

    // close position
    await txBuilder
      .buildWithdrawTransaction({
        baseCoinType: "0x1::aptos_coin::AptosCoin",
        targetCoinType: "0x1::aptos_coin::AptosCoin",
        id: pocketId,
      })
      .execute();

    const [untransformedPocket] = await txBuilder
      .buildGetPocket({ id: pocketId })
      .execute();
    const pocket = transformPocketEntity(untransformedPocket);

    expect(pocket.status).toEqual(PocketStatus.STATUS_WITHDRAWN);
    expect(pocket.base_coin_balance).toEqual(BigInt(0));
    expect(pocket.target_coin_balance).toEqual(BigInt(0));
  });

  it("[vault] should: fetching multiple pockets should work", async () => {
    const [[pocket1, pocket2]] = await txBuilder
      .buildGetMultiplePockets({
        idList: ["test-withdraw-pocket-id", "test-vault-pocket-data"],
      })
      .execute();

    expect(pocket1.id).toEqual("test-withdraw-pocket-id");
    expect(pocket2.id).toEqual("test-vault-pocket-data");
  });
});
