import { PocketResponseType } from "../response.type";

export interface PocketEntity {
  id: string;
  base_token_address: string;
  target_token_address: string;
  owner: string;
  base_token_balance: bigint;
  target_token_balance: bigint;
  amm: bigint;
  auto_close_condition: {
    closed_with: bigint;
    value: bigint;
  };
  batch_volume: bigint;
  executed_batch_amount: bigint;
  frequency: bigint;
  next_scheduled_execution_at: bigint;
  open_position_condition: {
    operator: bigint;
    value_x: bigint;
    value_y: bigint;
  };
  start_at: bigint;
  status: bigint;
  stop_loss_condition: {
    stopped_with: bigint;
    value: bigint;
  };
  take_profit_condition: {
    stopped_with: bigint;
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
    id: entity.id,
    base_token_address: entity.base_token_address,
    target_token_address: entity.target_token_address,
    owner: entity.owner,
    base_token_balance: BigInt(entity.base_token_balance),
    target_token_balance: BigInt(entity.target_token_balance),
    amm: BigInt(entity.amm),
    batch_volume: BigInt(entity.batch_volume),
    executed_batch_amount: BigInt(entity.executed_batch_amount),
    frequency: BigInt(entity.frequency),
    next_scheduled_execution_at: BigInt(entity.next_scheduled_execution_at),
    start_at: BigInt(entity.start_at),
    status: BigInt(entity.status),
    open_position_condition: {
      operator: BigInt(entity.open_position_condition.operator),
      value_x: BigInt(entity.open_position_condition.value_x),
      value_y: BigInt(entity.open_position_condition.value_y),
    },
    auto_close_condition: {
      closed_with: BigInt(entity.auto_close_condition.closed_with),
      value: BigInt(entity.auto_close_condition.value),
    },
    stop_loss_condition: {
      stopped_with: BigInt(entity.stop_loss_condition.stopped_with),
      value: BigInt(entity.stop_loss_condition.value),
    },
    take_profit_condition: {
      stopped_with: BigInt(entity.take_profit_condition.stopped_with),
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
