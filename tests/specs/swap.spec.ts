import { CoinClient } from "aptos";

import { TransactionSigner } from "../client/transaction.client";
import { TransactionBuilder } from "../client/transaction.builder";
import { CreatePocketParams } from "../client/params.type";
import {
  AMM,
  AutoCloseConditionClosedWith,
  OpenPositionOperator,
  StopConditionStoppedWith,
} from "../client/entities/pocket.entity";
import { AptosBootingManager } from "../aptos-node/aptos.boot";

const aptosNode = AptosBootingManager.getInstance();

describe("swap", function () {
  let signer: TransactionSigner;
  let txBuilder: TransactionBuilder;
  let coinClient: CoinClient;

  const pocketData: CreatePocketParams = {
    id: "test-vault-swap",
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
});
