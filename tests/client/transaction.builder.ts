import { HexString, TxnBuilderTypes } from "aptos";

import * as BCS from "./libs/bcs.helper";
import { AptosBootingManager } from "../aptos-node/aptos.boot";
import {
  CreatePocketParams,
  GetPocketParams,
  UpdatePocketParams,
} from "./params.type";
import { TransactionSigner } from "./transaction.client";
import { PocketResponseType } from "./response.type";

const { EntryFunction, TransactionPayloadEntryFunction } = TxnBuilderTypes;

interface Executor<T> {
  execute: () => Promise<T>;
}

/**
 * @notice Aptos Transaction Builder. Output would be raw transaction hex.
 */
export class TransactionBuilder {
  constructor(private signer: TransactionSigner) {}

  /**
   * @notice Get transactional executor
   * @param payload
   * @private
   */
  private getTransactionalExecutor(payload: any): Executor<{ txId: string }> {
    return {
      execute: async () => {
        return {
          txId: await this.signer.signAndSendTransaction(payload, true),
        };
      },
    };
  }

  /**
   * @notice Get view executor
   * @param payload
   * @private
   */
  private getViewExecutor<T>(payload: any): Executor<T> {
    return {
      execute: async () => {
        const result = await this.signer.view(payload);
        return result as T;
      },
    };
  }

  /**
   * @notice Build set operator transaction
   * @param target
   * @param value
   */
  public buildSetOperatorTransaction(
    target: string,
    value: boolean
  ): Executor<{ txId: string }> {
    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
          "set_operator",
          [],
          [
            BCS.bcsSerializeBytes(HexString.ensure(target).toUint8Array()),
            BCS.bcsSerializeBool(value),
          ]
        )
      )
    );
  }

  /**
   * @notice Build set interactive target transaction
   * @param target
   * @param value
   */
  public buildSetInteractiveTargetTransaction(
    target: string,
    value: boolean
  ): Executor<{ txId: string }> {
    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
          "set_interactive_target",
          [],
          [
            BCS.bcsSerializeBytes(HexString.ensure(target).toUint8Array()),
            BCS.bcsSerializeBool(value),
          ]
        )
      )
    );
  }

  /**
   * @notice Build create pocket transaction
   * @param params
   */
  public buildCreatePocketTransaction(params: CreatePocketParams) {
    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
          "create_pocket",
          [],
          [
            BCS.bcsSerializeStr(params.id),
            BCS.bcsSerializeBytes(
              HexString.ensure(params.baseTokenAddress).toUint8Array()
            ),
            BCS.bcsSerializeBytes(
              HexString.ensure(params.targetTokenAddress).toUint8Array()
            ),
            BCS.bcsSerializeU64(BigInt(params.amm)),
            BCS.bcsSerializeU64(params.startAt),
            BCS.bcsSerializeU64(params.frequency),
            BCS.bcsSerializeU256(params.batchVolume),
            BCS.bcsSerializeU64(BigInt(params.openPositionConditionOperator)),
            BCS.bcsSerializeU256(params.openPositionConditionValueX),
            BCS.bcsSerializeU256(params.openPositionConditionValueY),
            BCS.bcsSerializeU64(BigInt(params.stopLossConditionStoppedWith)),
            BCS.bcsSerializeU256(params.stopLossConditionStoppedValue),
            BCS.bcsSerializeU64(BigInt(params.takeProfitConditionStoppedWith)),
            BCS.bcsSerializeU256(params.takeProfitConditionStoppedValue),
            BCS.bcsSerializeU64(BigInt(params.autoCloseConditionClosedWith)),
            BCS.bcsSerializeU256(params.autoCloseConditionValue),
          ]
        )
      )
    );
  }

  /**
   * @notice Build update pocket transaction
   * @param params
   */
  public buildUpdatePocketTransaction(params: UpdatePocketParams) {
    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
          "update_pocket",
          [],
          [
            BCS.bcsSerializeStr(params.id),
            BCS.bcsSerializeU64(params.startAt),
            BCS.bcsSerializeU64(params.frequency),
            BCS.bcsSerializeU256(params.batchVolume),
            BCS.bcsSerializeU64(BigInt(params.openPositionConditionOperator)),
            BCS.bcsSerializeU256(params.openPositionConditionValueX),
            BCS.bcsSerializeU256(params.openPositionConditionValueY),
            BCS.bcsSerializeU64(BigInt(params.stopLossConditionStoppedWith)),
            BCS.bcsSerializeU256(params.stopLossConditionStoppedValue),
            BCS.bcsSerializeU64(BigInt(params.takeProfitConditionStoppedWith)),
            BCS.bcsSerializeU256(params.takeProfitConditionStoppedValue),
            BCS.bcsSerializeU64(BigInt(params.autoCloseConditionClosedWith)),
            BCS.bcsSerializeU256(params.autoCloseConditionValue),
          ]
        )
      )
    );
  }

  /**
   * @notice Build pause pocket transaction
   * @param params
   */
  public buildPausePocketTransaction(params: GetPocketParams) {
    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
          "pause_pocket",
          [],
          [BCS.bcsSerializeStr(params.id)]
        )
      )
    );
  }

  /**
   * @notice Build restart pocket transaction
   * @param params
   */
  public buildRestartPocketTransaction(params: GetPocketParams) {
    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
          "restart_pocket",
          [],
          [BCS.bcsSerializeStr(params.id)]
        )
      )
    );
  }

  /**
   * @notice Build close pocket transaction
   * @param params
   */
  public buildClosePocketTransaction(params: GetPocketParams) {
    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
          "close_pocket",
          [],
          [BCS.bcsSerializeStr(params.id)]
        )
      )
    );
  }

  /**
   * @notice Build update pocket transaction
   * @param params
   */
  public buildGetPocket(params: GetPocketParams) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<[PocketResponseType]>({
      function: `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef::get_pocket`,
      arguments: [
        HexString.fromUint8Array(
          new TextEncoder().encode(params.id)
        ).toString(),
      ],
      type_arguments: [],
    });
  }

  /**
   * @notice Build update pocket transaction
   * @param address
   */
  public buildCheckForAllowedAdmin(address: string) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<[boolean]>({
      function: `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef::is_admin`,
      arguments: [HexString.ensure(address).toString()],
      type_arguments: [],
    });
  }

  /**
   * @notice Build update pocket transaction
   * @param address
   */
  public buildCheckForAllowedTarget(address: string) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<[boolean]>({
      function: `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef::is_allowed_target`,
      arguments: [HexString.ensure(address).toString()],
      type_arguments: [],
    });
  }

  /**
   * @notice Build update pocket transaction
   * @param address
   */
  public buildCheckForAllowedOperator(address: string) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<[boolean]>({
      function: `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef::is_operator`,
      arguments: [HexString.ensure(address).toString()],
      type_arguments: [],
    });
  }
}
