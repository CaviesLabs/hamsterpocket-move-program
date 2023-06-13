import { HexString, TxnBuilderTypes, Types } from "aptos";

import * as BCS from "./libs/bcs.helper";
import { AptosBootingManager } from "../aptos-node/aptos.boot";
import {
  CreatePocketParams,
  GetPocketParams,
  UpdatePocketParams,
} from "./params.type";
import { add } from "husky";

const { EntryFunction, TransactionPayloadEntryFunction } = TxnBuilderTypes;

/**
 * @notice Aptos Transaction Builder. Output would be raw transaction hex.
 */
export class TransactionBuilder {
  /**
   * @notice Build set operator payload
   * @param target
   * @param value
   */
  public buildSetOperatorPayload(target: string, value: boolean) {
    /**
     * @dev Build transaction payload
     */
    return new TransactionPayloadEntryFunction(
      EntryFunction.natural(
        `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
        "set_operator",
        [],
        [
          BCS.bcsSerializeBytes(HexString.ensure(target).toUint8Array()),
          BCS.bcsSerializeBool(value),
        ]
      )
    );
  }

  /**
   * @notice Build set interactive target payload
   * @param target
   * @param value
   */
  public buildSetInteractiveTargetPayload(target: string, value: boolean) {
    /**
     * @dev Build transaction payload
     */
    return new TransactionPayloadEntryFunction(
      EntryFunction.natural(
        `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
        "set_interactive_target",
        [],
        [
          BCS.bcsSerializeBytes(HexString.ensure(target).toUint8Array()),
          BCS.bcsSerializeBool(value),
        ]
      )
    );
  }

  /**
   * @notice Build create pocket payload
   * @param params
   */
  public buildCreatePocketPayload(params: CreatePocketParams) {
    /**
     * @dev Build transaction payload
     */
    return new TransactionPayloadEntryFunction(
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
    );
  }

  /**
   * @notice Build update pocket payload
   * @param params
   */
  public buildUpdatePocketPayload(params: UpdatePocketParams) {
    /**
     * @dev Build transaction payload
     */
    return new TransactionPayloadEntryFunction(
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
    );
  }

  /**
   * @notice Build pause pocket payload
   * @param params
   */
  public buildPausePocketPayload(params: GetPocketParams) {
    /**
     * @dev Build transaction payload
     */
    return new TransactionPayloadEntryFunction(
      EntryFunction.natural(
        `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
        "pause_pocket",
        [],
        [BCS.bcsSerializeStr(params.id)]
      )
    );
  }

  /**
   * @notice Build restart pocket payload
   * @param params
   */
  public buildRestartPocketPayload(params: GetPocketParams) {
    /**
     * @dev Build transaction payload
     */
    return new TransactionPayloadEntryFunction(
      EntryFunction.natural(
        `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
        "restart_pocket",
        [],
        [BCS.bcsSerializeStr(params.id)]
      )
    );
  }

  /**
   * @notice Build close pocket payload
   * @param params
   */
  public buildClosePocketPayload(params: GetPocketParams) {
    /**
     * @dev Build transaction payload
     */
    return new TransactionPayloadEntryFunction(
      EntryFunction.natural(
        `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef`,
        "close_pocket",
        [],
        [BCS.bcsSerializeStr(params.id)]
      )
    );
  }

  /**
   * @notice Build update pocket payload
   * @param params
   */
  public buildGetPocketPayload(params: GetPocketParams): Types.ViewRequest {
    /**
     * @dev Build transaction payload
     */
    return {
      function: `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef::get_pocket`,
      arguments: [
        HexString.fromUint8Array(BCS.bcsSerializeStr(params.id)).toString(),
      ],
      type_arguments: [],
    };
  }

  /**
   * @notice Build update pocket payload
   * @param address
   */
  public buildCheckForAllowedAdmin(address: string): Types.ViewRequest {
    /**
     * @dev Build transaction payload
     */
    return {
      function: `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef::is_admin`,
      arguments: [HexString.ensure(address).toString()],
      type_arguments: [],
    };
  }

  /**
   * @notice Build update pocket payload
   * @param address
   */
  public buildCheckForAllowedTarget(address: string): Types.ViewRequest {
    /**
     * @dev Build transaction payload
     */
    return {
      function: `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef::is_allowed_target`,
      arguments: [HexString.ensure(address).toString()],
      type_arguments: [],
    };
  }

  /**
   * @notice Build update pocket payload
   * @param address
   */
  public buildCheckForAllowedOperator(address: string): Types.ViewRequest {
    /**
     * @dev Build transaction payload
     */
    return {
      function: `${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}::chef::is_operator`,
      arguments: [HexString.ensure(address).toString()],
      type_arguments: [],
    };
  }
}
