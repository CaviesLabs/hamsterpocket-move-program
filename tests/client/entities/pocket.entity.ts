import { PocketResponseType } from "../response.type";

export enum PocketStatus {
  STATUS_ACTIVE = 0x0,
  STATUS_PAUSED = 0x1,
  STATUS_CLOSED = 0x2,
  STATUS_WITHDRAWN = 0x3,
}

export enum AMM {
  PCS = 0x0,
}

export enum OpenPositionOperator {
  UNSET = 0x0,
  OPERATOR_EQ = 0x1,
  OPERATOR_NEQ = 0x2,
  OPERATOR_GT = 0x3,
  OPERATOR_GTE = 0x4,
  OPERATOR_LT = 0x5,
  OPERATOR_LTE = 0x6,
  OPERATOR_BW = 0x7,
  OPERATOR_NBW = 0x8,
}

export enum StopConditionStoppedWith {
  UNSET = 0x0,
  STOPPED_WITH_PRICE = 0x1,
  STOPPED_WITH_PORTFOLIO_VALUE_DIFF = 0x2,
  STOPPED_WITH_PORTFOLIO_PERCENT_DIFF = 0x3,
}

export enum AutoCloseConditionClosedWith {
  CLOSED_WITH_END_TIME = 0x0,
  CLOSED_WITH_BATCH_AMOUNT = 0x1,
  CLOSED_WITH_SPENT_BASE_AMOUNT = 0x2,
  CLOSED_WITH_RECEIVED_TARGET_AMOUNT = 0x3,
}

export interface PocketEntity {
  id: string;
  base_coin_type: string;
  target_coin_type: string;
  owner: string;
  base_coin_balance: bigint;
  target_coin_balance: bigint;
  amm: AMM;
  status: PocketStatus;
  auto_close_conditions: {
    closed_with: AutoCloseConditionClosedWith;
    value: bigint;
  }[];
  batch_volume: bigint;
  executed_batch_amount: bigint;
  frequency: bigint;
  next_scheduled_execution_at: bigint;
  open_position_condition: {
    operator: OpenPositionOperator;
    value_x: bigint;
    value_y: bigint;
  };
  start_at: bigint;
  stop_loss_condition: {
    stopped_with: StopConditionStoppedWith;
    value: bigint;
  };
  take_profit_condition: {
    stopped_with: StopConditionStoppedWith;
    value: bigint;
  };
  total_closed_position_in_target_amount: bigint;
  total_deposited_base_amount: bigint;
  total_received_fund_in_base_amount: bigint;
  total_received_target_amount: bigint;
  total_swapped_base_amount: bigint;
}

export const transformPocketEntity = (
  entity: PocketResponseType
): PocketEntity => {
  return {
    amm: parseInt(entity.amm) as AMM,
    status: parseInt(entity.status) as PocketStatus,
    id: entity.id,
    base_coin_type: entity.base_coin_type,
    target_coin_type: entity.target_coin_type,
    owner: entity.owner,
    base_coin_balance: BigInt(entity.base_coin_balance),
    target_coin_balance: BigInt(entity.target_coin_balance),
    batch_volume: BigInt(entity.batch_volume),
    executed_batch_amount: BigInt(entity.executed_batch_amount),
    frequency: BigInt(entity.frequency),
    next_scheduled_execution_at: BigInt(entity.next_scheduled_execution_at),
    start_at: BigInt(entity.start_at),
    open_position_condition: {
      operator: parseInt(
        entity.open_position_condition.operator
      ) as OpenPositionOperator,
      value_x: BigInt(entity.open_position_condition.value_x),
      value_y: BigInt(entity.open_position_condition.value_y),
    },
    auto_close_conditions: entity.auto_close_conditions.map((condition) => ({
      closed_with: parseInt(
        condition.closed_with
      ) as AutoCloseConditionClosedWith,
      value: BigInt(condition.value),
    })),
    stop_loss_condition: {
      stopped_with: parseInt(
        entity.stop_loss_condition.stopped_with
      ) as StopConditionStoppedWith,
      value: BigInt(entity.stop_loss_condition.value),
    },
    take_profit_condition: {
      stopped_with: parseInt(
        entity.take_profit_condition.stopped_with
      ) as StopConditionStoppedWith,
      value: BigInt(entity.take_profit_condition.value),
    },
    total_closed_position_in_target_amount: BigInt(
      entity.total_closed_position_in_target_amount
    ),
    total_deposited_base_amount: BigInt(entity.total_deposited_base_amount),
    total_received_fund_in_base_amount: BigInt(
      entity.total_received_fund_in_base_amount
    ),
    total_received_target_amount: BigInt(entity.total_received_target_amount),
    total_swapped_base_amount: BigInt(entity.total_swapped_base_amount),
  };
};
