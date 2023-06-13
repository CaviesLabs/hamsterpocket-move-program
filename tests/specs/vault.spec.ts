import { AptosAccount, CoinClient } from "aptos";

import { TransactionSigner } from "../client/transaction.client";
import { TransactionBuilder } from "../client/transaction.builder";
import { CreatePocketParams } from "../client/params.type";
import {
  AMM,
  AutoCloseConditionClosedWith,
  OpenPositionOperator,
  PocketStatus,
  StopConditionStoppedWith,
  transformPocketEntity,
} from "../client/entities/pocket.entity";
import { AptosBootingManager } from "../aptos-node/aptos.boot";
import { APTOS_COIN_ADDRESS } from "../client/libs/constants";

describe("vault", function () {
  let signer: TransactionSigner;
  let txBuilder: TransactionBuilder;
  let coinClient: CoinClient;

  const pocketData: CreatePocketParams = {
    id: "test-vault-pocket-data",
    amm: AMM.PCS,
    baseTokenAddress: APTOS_COIN_ADDRESS,
    targetTokenAddress: APTOS_COIN_ADDRESS,
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
    coinClient = new CoinClient(signer.getClient());

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
        target: APTOS_COIN_ADDRESS,
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
        tokenAddress: APTOS_COIN_ADDRESS,
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
    const [untransformedPocket] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    const pocket = transformPocketEntity(untransformedPocket);

    expect(pocket.status).toEqual(PocketStatus.STATUS_ACTIVE);
    expect(pocket.base_token_balance).toEqual(BigInt(10000));
    expect(pocket.target_token_balance).toEqual(BigInt(0));
  });

  it("[vault] should: can withdraw token", async () => {
    /**
     * @dev Close pocket first
     */
    await txBuilder
      .buildClosePocketTransaction({ id: pocketData.id })
      .execute();

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
      .buildWithdrawTransaction({
        baseTokenAddress: APTOS_COIN_ADDRESS,
        targetTokenAddress: APTOS_COIN_ADDRESS,
        id: pocketData.id,
      })
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
    expect(pocket.base_token_balance).toEqual(BigInt(0));
    expect(pocket.target_token_balance).toEqual(BigInt(0));
  });
});
