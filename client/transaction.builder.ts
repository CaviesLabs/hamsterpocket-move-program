import { HexString, TxnBuilderTypes, BCS, Types } from "aptos";

import {
  CreatePocketParams,
  CreateResourceAccountParams,
  DepositParams,
  ExecTradingParams,
  GetMultiplePocketsParams,
  GetPocketParams,
  GetQuoteParams,
  ProgramUpgradeParams,
  SetAllowedAdminParams,
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

/**
 * @notice Aptos Transaction Builder. Output would be raw transaction hex.
 */
export class TransactionBuilder {
  constructor(
    private signer: TransactionSigner,
    private resourceAccount: string | null
  ) {}

  /**
   * @notice Get transactional executor
   * @param payload
   * @private
   */
  private getTransactionalExecutor(payload: any) {
    return {
      execute: async () => {
        return {
          txId: await this.signer.signAndSendTransaction(payload, true),
        };
      },
      simulate: async () => this.signer.simulate(payload),
    };
  }

  /**
   * @notice Get view executor
   * @param payload
   * @private
   */
  private getViewExecutor<T>(payload: any) {
    return {
      execute: async () => {
        const result = await this.signer.view(payload);
        return result as T;
      },
    };
  }

  /**
   * @notice Build operator make dca swap transaction
   * @param execTradingParams
   */
  public buildOperatorClosePositionTransaction(
    execTradingParams: ExecTradingParams
  ) {
    const baseCoin = new TypeTagStruct(
      StructTag.fromString(execTradingParams.baseCoinType)
    );
    const targetCoin = new TypeTagStruct(
      StructTag.fromString(execTradingParams.targetCoinType)
    );

    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "operator_close_position",
          [baseCoin, targetCoin],
          [
            BCS.bcsSerializeStr(execTradingParams.id),
            BCS.bcsSerializeUint64(execTradingParams.minAmountOut),
          ]
        )
      )
    );
  }

  public buildUpgradeTransaction(params: ProgramUpgradeParams) {
    // serialize modules
    const modules = params.code.map(
      (code) => new TxnBuilderTypes.Module(new HexString(code).toUint8Array())
    );
    const codeSerializer = new BCS.Serializer();
    BCS.serializeVector(modules, codeSerializer);

    // serialize metadata
    const metadata = new HexString(params.serializedMetadata).toUint8Array();

    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "upgrade",
          [],
          [BCS.bcsSerializeBytes(metadata), codeSerializer.getBytes()]
        )
      )
    );
  }

  /**
   * @notice Build operator make dca swap transaction
   * @param execTradingParams
   */
  public buildOperatorMakeDCASwapTransaction(
    execTradingParams: ExecTradingParams
  ) {
    const baseCoin = new TypeTagStruct(
      StructTag.fromString(execTradingParams.baseCoinType)
    );
    const targetCoin = new TypeTagStruct(
      StructTag.fromString(execTradingParams.targetCoinType)
    );

    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "operator_make_dca_swap",
          [baseCoin, targetCoin],
          [
            BCS.bcsSerializeStr(execTradingParams.id),
            BCS.bcsSerializeUint64(execTradingParams.minAmountOut),
          ]
        )
      )
    );
  }

  /**
   * @notice Build close position and withdraw pocket transaction
   * @param execTradingParams
   */
  public buildClosePositionAndWithdrawTransaction(
    execTradingParams: ExecTradingParams
  ) {
    const baseCoin = new TypeTagStruct(
      StructTag.fromString(execTradingParams.baseCoinType)
    );
    const targetCoin = new TypeTagStruct(
      StructTag.fromString(execTradingParams.targetCoinType)
    );

    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "close_position_and_withdraw",
          [baseCoin, targetCoin],
          [
            BCS.bcsSerializeStr(execTradingParams.id),
            BCS.bcsSerializeUint64(execTradingParams.minAmountOut),
          ]
        )
      )
    );
  }

  /**
   * @notice Build close position
   * @param execTradingParams
   */
  public buildClosePositionTransaction(execTradingParams: ExecTradingParams) {
    const baseCoin = new TypeTagStruct(
      StructTag.fromString(execTradingParams.baseCoinType)
    );
    const targetCoin = new TypeTagStruct(
      StructTag.fromString(execTradingParams.targetCoinType)
    );

    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "close_position",
          [baseCoin, targetCoin],
          [
            BCS.bcsSerializeStr(execTradingParams.id),
            BCS.bcsSerializeUint64(execTradingParams.minAmountOut),
          ]
        )
      )
    );
  }

  /**
   * @notice Build close and withdraw pocket transaction
   * @param closePocketParams
   * @param withdrawParams
   */
  public buildClosePocketAndWithdrawTransaction(
    closePocketParams: GetPocketParams,
    withdrawParams: WithdrawParams
  ) {
    const baseCoin = new TypeTagStruct(
      StructTag.fromString(withdrawParams.baseCoinType)
    );
    const targetCoin = new TypeTagStruct(
      StructTag.fromString(withdrawParams.targetCoinType)
    );

    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "close_and_withdraw_pocket",
          [baseCoin, targetCoin],
          [BCS.bcsSerializeStr(closePocketParams.id)]
        )
      )
    );
  }

  /**
   * @notice Build create and deposit pocket
   * @param createPocketParams
   * @param depositParams
   */
  public buildCreatePocketAndDepositTransaction(
    createPocketParams: CreatePocketParams,
    depositParams: DepositParams
  ) {
    const baseCoin = new TypeTagStruct(
      StructTag.fromString(createPocketParams.baseCoinType)
    );
    const targetCoin = new TypeTagStruct(
      StructTag.fromString(createPocketParams.targetCoinType)
    );

    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "create_and_deposit_to_pocket",
          [baseCoin, targetCoin],
          [
            BCS.bcsSerializeStr(createPocketParams.id),
            BCS.bcsSerializeUint64(BigInt(createPocketParams.amm)),
            BCS.bcsSerializeUint64(createPocketParams.startAt),
            BCS.bcsSerializeUint64(createPocketParams.frequency),
            BCS.bcsSerializeUint64(createPocketParams.batchVolume),
            BCS.serializeVectorWithFunc(
              [
                createPocketParams.openPositionCondition[0],
                createPocketParams.openPositionCondition[1],
                createPocketParams.openPositionCondition[2],
              ],
              "serializeU64"
            ),
            BCS.serializeVectorWithFunc(
              [
                createPocketParams.takeProfitCondition[0],
                createPocketParams.takeProfitCondition[1],
              ],
              "serializeU64"
            ),

            BCS.serializeVectorWithFunc(
              [
                createPocketParams.stopLossCondition[0],
                createPocketParams.stopLossCondition[1],
              ],
              "serializeU64"
            ),
            BCS.serializeVectorWithFunc(
              createPocketParams.autoClosedConditions.reduce<bigint[]>(
                (accum, condition) => accum.concat(condition as bigint[]),
                []
              ),
              "serializeU64"
            ),
            BCS.bcsSerializeUint64(depositParams.amount),
          ]
        )
      )
    );
  }

  /**
   * @notice Build create resource account transaction
   * @param params
   */
  public buildCreateResourceAccountTransaction(
    params: CreateResourceAccountParams
  ) {
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
            BCS.bcsSerializeUint64(params.amountToFund),
          ]
        )
      )
    );
  }

  /**
   * @notice Build transfer admin transaction
   * @param params
   */
  public buildTransferAdminTransaction(params: SetAllowedAdminParams) {
    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "transfer_admin",
          [],
          [
            BCS.bcsSerializeBytes(
              HexString.ensure(params.target).toUint8Array()
            ),
          ]
        )
      )
    );
  }

  /**
   * @notice Build set allowed operator transaction
   * @param params
   */
  public buildSetOperatorTransaction(params: SetAllowedOperatorParams) {
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
      StructTag.fromString(`${params.coinType}`)
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
          [
            BCS.bcsSerializeStr(params.id),
            BCS.bcsSerializeUint64(params.amount),
          ]
        )
      )
    );
  }

  /**
   * @notice Build withdraw transaction
   * @param params
   */
  public buildWithdrawTransaction(params: WithdrawParams) {
    const baseCoin = new TypeTagStruct(
      StructTag.fromString(`${params.baseCoinType}`)
    );
    const targetCoin = new TypeTagStruct(
      StructTag.fromString(`${params.targetCoinType}`)
    );

    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "withdraw",
          [baseCoin, targetCoin],
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
  ) {
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
            BCS.bcsSerializeStr(params.target),
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
    const baseCoin = new TypeTagStruct(
      StructTag.fromString(params.baseCoinType)
    );
    const targetCoin = new TypeTagStruct(
      StructTag.fromString(params.targetCoinType)
    );

    /**
     * @dev Build transaction
     */
    return this.getTransactionalExecutor(
      new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${this.resourceAccount}::chef`,
          "create_pocket",
          [baseCoin, targetCoin],
          [
            BCS.bcsSerializeStr(params.id),
            BCS.bcsSerializeUint64(BigInt(params.amm)),
            BCS.bcsSerializeUint64(params.startAt),
            BCS.bcsSerializeUint64(params.frequency),
            BCS.bcsSerializeUint64(params.batchVolume),
            BCS.serializeVectorWithFunc(
              [
                params.openPositionCondition[0],
                params.openPositionCondition[1],
                params.openPositionCondition[2],
              ],
              "serializeU64"
            ),
            BCS.serializeVectorWithFunc(
              [params.takeProfitCondition[0], params.takeProfitCondition[1]],
              "serializeU64"
            ),

            BCS.serializeVectorWithFunc(
              [params.stopLossCondition[0], params.stopLossCondition[1]],
              "serializeU64"
            ),
            BCS.serializeVectorWithFunc(
              params.autoClosedConditions.reduce<bigint[]>(
                (accum, condition) => accum.concat(condition as bigint[]),
                []
              ),
              "serializeU64"
            ),
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
            BCS.bcsSerializeUint64(params.startAt),
            BCS.bcsSerializeUint64(params.frequency),
            BCS.bcsSerializeUint64(params.batchVolume),
            BCS.serializeVectorWithFunc(
              [
                params.openPositionCondition[0],
                params.openPositionCondition[1],
                params.openPositionCondition[2],
              ],
              "serializeU64"
            ),
            BCS.serializeVectorWithFunc(
              [params.takeProfitCondition[0], params.takeProfitCondition[1]],
              "serializeU64"
            ),

            BCS.serializeVectorWithFunc(
              [params.stopLossCondition[0], params.stopLossCondition[1]],
              "serializeU64"
            ),
            BCS.serializeVectorWithFunc(
              params.autoClosedConditions.reduce<bigint[]>(
                (accum, condition) => accum.concat(condition as bigint[]),
                []
              ),
              "serializeU64"
            ),
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
   * @notice Build get multiple pockets
   * @param params
   */
  public buildGetMultiplePockets(params: GetMultiplePocketsParams) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<PocketResponseType[]>({
      function: `${this.resourceAccount}::chef::get_multiple_pockets`,
      arguments: [
        params.idList.map((id) =>
          HexString.fromUint8Array(new TextEncoder().encode(id)).toString()
        ),
      ],
      type_arguments: [],
    });
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
   * @param target
   */
  public buildCheckForAllowedTarget(target: string) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<[boolean]>({
      function: `${this.resourceAccount}::chef::is_allowed_target`,
      arguments: [
        HexString.fromUint8Array(new TextEncoder().encode(target)).toString(),
      ],
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

  /**
   * @notice build get quote for a pair
   * @param params
   */
  public buildGetQuote(params: GetQuoteParams) {
    /**
     * @dev Build transaction
     */
    return this.getViewExecutor<[string]>({
      function: `${this.resourceAccount}::chef::get_quote`,
      arguments: [`${params.amountIn}`],
      type_arguments: [params.baseCoinType, params.targetCoinType],
    });
  }
}
