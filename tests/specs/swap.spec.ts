import {
  AptosAccount,
  AptosClient,
  CoinClient,
  getAddressFromAccountOrAddress,
  MaybeHexString,
} from "aptos";

import { TransactionSigner } from "../../client/transaction.client";
import { TransactionBuilder } from "../../client/transaction.builder";
import { CreatePocketParams, DepositParams } from "../../client/params.type";
import {
  AMM,
  AutoCloseConditionClosedWith,
  OpenPositionOperator,
  PocketStatus,
  StopConditionStoppedWith,
  transformPocketEntity,
} from "../../client/entities/pocket.entity";
import { AptosBootingManager } from "../aptos-node/aptos.boot";

const aptosNode = AptosBootingManager.getInstance();

const checkBalance = async (
  aptosClient: AptosClient,
  account: MaybeHexString,
  extraArgs: {
    // The coin type to use, defaults to 0x1::aptos_coin::AptosCoin
    coinType: string;
  }
): Promise<bigint> => {
  const coinType = extraArgs.coinType;
  const typeTag = `0x1::coin::CoinStore<${coinType}>`;
  const address = getAddressFromAccountOrAddress(account);
  const accountResource = await aptosClient.getAccountResource(
    address,
    typeTag
  );
  return BigInt((accountResource.data as any).coin.value);
};

describe("swap", function () {
  let txBuilder: TransactionBuilder;
  let operatorTxBuilder: TransactionBuilder;
  let adminTxBuilder: TransactionBuilder;

  let aptosAccount: AptosAccount;
  let operator: AptosAccount;

  let coinClient: CoinClient;

  const testnetUSDC =
    "0x8e5d2ca0e6cc98e6cd8d2f2396709ec2a9f4ce6c526baa2ac2cb595af101cc91::tusdc::TUSDC";
  const aptosCoin = "0x1::aptos_coin::AptosCoin";

  const pocketData: CreatePocketParams = {
    id: "test-vault-swap",
    amm: AMM.PCS,
    baseCoinType: aptosCoin,
    targetCoinType: testnetUSDC,
    batchVolume: BigInt(1e8 * 0.01),
    frequency: BigInt(3600),
    startAt: BigInt(parseInt((new Date().getTime() / 1000).toString())),
    openPositionCondition: [OpenPositionOperator.UNSET, BigInt(0), BigInt(0)],
    stopLossCondition: [
      StopConditionStoppedWith.STOPPED_WITH_PRICE,
      BigInt(1e8 * 250_000),
    ], // price per base coin
    takeProfitCondition: [StopConditionStoppedWith.UNSET, BigInt(0)],
    autoClosedConditions: [
      [AutoCloseConditionClosedWith.CLOSED_WITH_BATCH_AMOUNT, BigInt(1)],
    ],
  };
  const depositParams: DepositParams = {
    id: pocketData.id,
    amount: BigInt(1e6 * 5),
    coinType: pocketData.baseCoinType,
  };

  beforeAll(async () => {
    /**
     * @dev create new account
     */
    aptosAccount = await aptosNode.createAndFundAccount();
    operator = await aptosNode.createAndFundAccount();

    /**
     * @dev build signer and tx builder
     */
    txBuilder = new TransactionBuilder(
      new TransactionSigner(
        aptosAccount.toPrivateKeyObject().privateKeyHex,
        AptosBootingManager.APTOS_NODE_URL
      ),
      aptosNode.resourceAccountAddress
    );
    operatorTxBuilder = new TransactionBuilder(
      new TransactionSigner(
        operator.toPrivateKeyObject().privateKeyHex,
        AptosBootingManager.APTOS_NODE_URL
      ),
      aptosNode.resourceAccountAddress
    );
    coinClient = new CoinClient(
      new AptosClient(AptosBootingManager.APTOS_NODE_URL)
    );

    /**
     * @dev Build admin tx builder
     */
    adminTxBuilder = new TransactionBuilder(
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
        target: aptosCoin,
        value: true,
      })
      .execute();

    /**
     * @dev Whitelist target first
     */
    await adminTxBuilder
      .buildSetInteractiveTargetTransaction({
        target: testnetUSDC,
        value: true,
      })
      .execute();

    /**
     * @dev Whitelist operator
     */
    await adminTxBuilder
      .buildSetOperatorTransaction({
        target: operator.address().hex(),
        value: true,
      })
      .execute();

    /**
     * @dev Create a pocket
     */
    await txBuilder
      .buildCreatePocketAndDepositTransaction(pocketData, depositParams)
      .execute();
  });

  it("[swap] should: get quote should work", async () => {
    const [amountOut] = await txBuilder
      .buildGetQuote({
        amountIn: BigInt(1e8 * 0.01),
        baseCoinType: aptosCoin,
        targetCoinType: testnetUSDC,
      })
      .execute();

    expect(BigInt(amountOut)).toBeLessThan(BigInt(1e8 * 5000));
    expect(BigInt(amountOut)).toBeGreaterThan(BigInt(0));
    expect(BigInt(amountOut) != BigInt(1e8 * 0.01)).toBeTruthy();
  });

  it("[swap] should: created pocket data was recorded properly", async () => {
    // make sure the pocket was created properly
    const [rawPocket] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    const pocket = transformPocketEntity(rawPocket);

    expect(pocket.id).toEqual(pocketData.id);
    expect(pocket.status).toEqual(PocketStatus.STATUS_ACTIVE);
    expect(pocket.base_coin_balance).toEqual(BigInt(1e6 * 5));
    expect(pocket.target_coin_balance).toEqual(BigInt(0));
  });

  it("[swap] should: operator can make dca swap properly", async () => {
    // now we make swap
    await operatorTxBuilder
      .buildOperatorMakeDCASwapTransaction({
        minAmountOut: BigInt(0),
        id: pocketData.id,
        baseCoinType: aptosCoin,
        targetCoinType: testnetUSDC,
      })
      .execute();

    const [rawPocket] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    const pocket = transformPocketEntity(rawPocket);

    // now we should make sure the pocket was updated properly
    expect(pocket.id).toEqual(pocketData.id);
    expect(pocket.status).toEqual(PocketStatus.STATUS_CLOSED); // closed due to auto close condition
    expect(pocket.base_coin_balance).toEqual(BigInt(1e6 * 4));
    expect(pocket.target_coin_balance).toBeGreaterThan(BigInt(0));
  });

  it("[swap] should: operator can make close position swap properly", async () => {
    // now we make swap
    await operatorTxBuilder
      .buildOperatorClosePositionTransaction({
        minAmountOut: BigInt(0),
        id: pocketData.id,
        baseCoinType: aptosCoin,
        targetCoinType: testnetUSDC,
      })
      .execute();

    const [rawPocket] = await txBuilder
      .buildGetPocket({ id: pocketData.id })
      .execute();
    const pocket = transformPocketEntity(rawPocket);

    expect(pocket.id).toEqual(pocketData.id);
    expect(pocket.status).toEqual(PocketStatus.STATUS_CLOSED); // closed due to auto close condition
    expect(pocket.base_coin_balance).toBeGreaterThan(BigInt(1e6 * 4));
    expect(pocket.target_coin_balance).toEqual(BigInt(0));
  });

  it("[swap] should: owner close position and withdraw successfully", async () => {
    const pocketId = "test-vault-close-position-and-withdraw";

    // create a pocket
    await txBuilder
      .buildCreatePocketAndDepositTransaction(
        {
          ...pocketData,
          id: pocketId,
        },
        depositParams
      )
      .execute();

    // now make dca swap
    await operatorTxBuilder
      .buildOperatorMakeDCASwapTransaction({
        minAmountOut: BigInt(0),
        id: pocketId,
        baseCoinType: aptosCoin,
        targetCoinType: testnetUSDC,
      })
      .execute();

    const aptosBalance = await checkBalance(
      new AptosClient(AptosBootingManager.APTOS_NODE_URL),
      aptosAccount.address().hex(),
      { coinType: aptosCoin }
    );

    await txBuilder
      .buildClosePositionAndWithdrawTransaction({
        minAmountOut: BigInt(0),
        id: pocketId,
        baseCoinType: aptosCoin,
        targetCoinType: testnetUSDC,
      })
      .execute();

    const [rawPocket] = await txBuilder
      .buildGetPocket({ id: pocketId })
      .execute();
    const pocket = transformPocketEntity(rawPocket);

    // now we should make sure the pocket was updated properly
    expect(pocket.id).toEqual(pocketId);
    expect(pocket.status).toEqual(PocketStatus.STATUS_WITHDRAWN); // update to "withdrawn"
    expect(pocket.base_coin_balance).toEqual(BigInt(0));
    expect(pocket.target_coin_balance).toEqual(BigInt(0));

    // since we did withdrawal, the after balance must be greater than original balance
    expect(await coinClient.checkBalance(aptosAccount)).toBeGreaterThan(
      aptosBalance
    );
    expect(
      await checkBalance(
        new AptosClient(AptosBootingManager.APTOS_NODE_URL),
        aptosAccount.address().hex(),
        { coinType: testnetUSDC }
      )
    ).toEqual(BigInt(0));
  });
});
