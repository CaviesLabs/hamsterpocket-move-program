import { HexString, TxnBuilderTypes } from "aptos";

import * as BCS from "./libs/bcs.helper";
import {
  CreatePocketParams,
  CreateResourceAccountParams,
  DepositParams,
  GetPocketParams,
  GetResourceAccountParams,
  SetAllowedOperatorParams,
  SetInteractiveTargetParams,
  UpdatePocketParams,
  WithdrawParams,
} from "./params.type";
import { TransactionSigner } from "./transaction.client";
import { PocketResponseType } from "./response.type";
import { APTOS_GENESIS_ADDRESS } from "./libs/constants";

const {
  EntryFunction,
  TransactionPayloadEntryFunction,
  TypeTagStruct,
  StructTag,
} = TxnBuilderTypes;

interface Executor<T> {
  execute: () => Promise<T>;
}

/**
 * @notice Aptos Transaction Builder. Output would be raw transaction hex.
 */
export class TransactionBuilder {
  constructor(
    private signer: TransactionSigner,
    private resourceAccount?: string
  ) {}

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
   * @notice Build create resource account transaction
   * @param params
   */
  public buildCreateResourceAccountTransaction(
    params: CreateResourceAccountParams
  ): Executor<{ txId: string }> {
    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${APTOS_GENESIS_ADDRESS}::resource_account`,
          "create_resource_account_and_fund",
          [],
          [
            BCS.bcsSerializeBytes(new TextEncoder().encode(params.seed)),
            BCS.bcsSerializeBytes(
              HexString.ensure(params.ownerAddress).toUint8Array()
            ),
            BCS.bcsSerializeU64(params.amountToFund),
          ]
        )
      )
    );
  }

  /**
   * @notice Build set allowed operator transaction
   * @param params
   */
  public buildSetOperatorTransaction(
    params: SetAllowedOperatorParams
  ): Executor<{ txId: string }> {
    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "set_operator",
          [],
          [
            BCS.bcsSerializeBytes(
              HexString.ensure(params.target).toUint8Array()
            ),
            BCS.bcsSerializeBool(params.value),
          ]
        )
      )
    );
  }

  /**
   * @notice Build deposit transaction
   * @param params
   */
  public buildDepositTransaction(params: DepositParams) {
    const tokenTag = new TypeTagStruct(
      StructTag.fromString(`${params.tokenAddress}::aptos_coin::AptosCoin`)
    );

    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "deposit",
          [tokenTag],
          [BCS.bcsSerializeStr(params.id), BCS.bcsSerializeU64(params.amount)]
        )
      )
    );
  }

  /**
   * @notice Build withdraw transaction
   * @param params
   */
  public buildWithdrawTransaction(params: WithdrawParams) {
    const baseToken = new TypeTagStruct(
      StructTag.fromString(`${params.baseTokenAddress}::aptos_coin::AptosCoin`)
    );
    const targetToken = new TypeTagStruct(
      StructTag.fromString(
        `${params.targetTokenAddress}::aptos_coin::AptosCoin`
      )
    );

    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "withdraw",
          [baseToken, targetToken],
          [BCS.bcsSerializeStr(params.id)]
        )
      )
    );
  }

  /**
   * @notice Build set interactive target transaction
   * @param params
   */
  public buildSetInteractiveTargetTransaction(
    params: SetInteractiveTargetParams
  ): Executor<{ txId: string }> {
    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "set_interactive_target",
          [],
          [
            BCS.bcsSerializeBytes(new HexString(params.target).toUint8Array()),
            BCS.bcsSerializeBool(params.value),
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
          `${this.resourceAccount}::chef`,
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
            BCS.bcsSerializeU64(params.batchVolume),
            BCS.bcsSerializeU64(BigInt(params.openPositionConditionOperator)),
            BCS.bcsSerializeU64(params.openPositionConditionValueX),
            BCS.bcsSerializeU64(params.openPositionConditionValueY),
            BCS.bcsSerializeU64(BigInt(params.stopLossConditionStoppedWith)),
            BCS.bcsSerializeU64(params.stopLossConditionStoppedValue),
            BCS.bcsSerializeU64(BigInt(params.takeProfitConditionStoppedWith)),
            BCS.bcsSerializeU64(params.takeProfitConditionStoppedValue),
            BCS.bcsSerializeU64(BigInt(params.autoCloseConditionClosedWith)),
            BCS.bcsSerializeU64(params.autoCloseConditionValue),
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
          `${this.resourceAccount}::chef`,
          "update_pocket",
          [],
          [
            BCS.bcsSerializeStr(params.id),
            BCS.bcsSerializeU64(params.startAt),
            BCS.bcsSerializeU64(params.frequency),
            BCS.bcsSerializeU64(params.batchVolume),
            BCS.bcsSerializeU64(BigInt(params.openPositionConditionOperator)),
            BCS.bcsSerializeU64(params.openPositionConditionValueX),
            BCS.bcsSerializeU64(params.openPositionConditionValueY),
            BCS.bcsSerializeU64(BigInt(params.stopLossConditionStoppedWith)),
            BCS.bcsSerializeU64(params.stopLossConditionStoppedValue),
            BCS.bcsSerializeU64(BigInt(params.takeProfitConditionStoppedWith)),
            BCS.bcsSerializeU64(params.takeProfitConditionStoppedValue),
            BCS.bcsSerializeU64(BigInt(params.autoCloseConditionClosedWith)),
            BCS.bcsSerializeU64(params.autoCloseConditionValue),
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
          `${this.resourceAccount}::chef`,
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
          `${this.resourceAccount}::chef`,
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
          `${this.resourceAccount}::chef`,
          "close_pocket",
          [],
          [BCS.bcsSerializeStr(params.id)]
        )
      )
    );
  }

  /**
   * @notice Build get pocket
   * @param params
   */
  public buildGetPocket(params: GetPocketParams) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<[PocketResponseType]>({
      function: `${this.resourceAccount}::chef::get_pocket`,
      arguments: [
        HexString.fromUint8Array(
          new TextEncoder().encode(params.id)
        ).toString(),
      ],
      type_arguments: [],
    });
  }

  /**
   * @notice Build check for allowed admin
   * @param address
   */
  public buildCheckForAllowedAdmin(address: string) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<[boolean]>({
      function: `${this.resourceAccount}::chef::is_admin`,
      arguments: [HexString.ensure(address).toString()],
      type_arguments: [],
    });
  }

  /**
   * @notice Build check for allowed target
   * @param address
   */
  public buildCheckForAllowedTarget(address: string) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<[boolean]>({
      function: `${this.resourceAccount}::chef::is_allowed_target`,
      arguments: [HexString.ensure(address).toString()],
      type_arguments: [],
    });
  }

  /**
   * @notice Build check for allowed operator
   * @param address
   */
  public buildCheckForAllowedOperator(address: string) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<[boolean]>({
      function: `${this.resourceAccount}::chef::is_operator`,
      arguments: [HexString.ensure(address).toString()],
      type_arguments: [],
    });
  }

  /**
   * @notice Build get delegated vault address
   * @param signer
   */
  public buildGetDelegatedVaultAddress(signer: string) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<[string]>({
      function: `${this.resourceAccount}::chef::get_delegated_vault_address`,
      arguments: [HexString.ensure(signer).toString()],
      type_arguments: [],
    });
  }
}
