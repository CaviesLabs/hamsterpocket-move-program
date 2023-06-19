export interface PocketResponseType {
  amm: string;
  auto_close_conditions: {
    closed_with: string;
    value: string;
  }[];
  base_coin_type: string;
  base_coin_balance: string;
  batch_volume: string;
  executed_batch_amount: string;
  frequency: string;
  id: string;
  next_scheduled_execution_at: string;
  open_position_condition: {
    operator: string;
    value_x: string;
    value_y: string;
  };
  owner: string;
  start_at: string;
  status: string;
  stop_loss_condition: {
    stopped_with: string;
    value: string;
  };
  take_profit_condition: {
    stopped_with: string;
    value: string;
  };
  target_coin_type: string;
  target_coin_balance: string;
  total_closed_position_in_target_amount: string;
  total_deposited_base_amount: string;
  total_received_fund_in_base_amount: string;
  total_received_target_amount: string;
  total_swapped_base_amount: string;
}
