import { PocketEntity } from "./pocket.entity";

export enum EventName {
  Upgrade = "upgrade",
  UpdateAllowedAdmin = "update_allowed_admin",
  UpdateAllowedOperator = "update_allowed_operator",
  UpdateAllowedTarget = "update_allowed_target",
  CreatePocket = "create_pocket",
  UpdatePocket = "update_pocket",
  UpdatePocketStatus = "update_pocket_status",
  UpdateTradingStats = "update_trading_stats",
  UpdateClosePositionStats = "update_close_position_stats",
  UpdateDepositStats = "update_deposit_stats",
  UpdateWithdrawalStats = "update_withdrawal_stats",
}

export enum EventReason {
  OPERATOR_STOPPED_LOSS = "OPERATOR_STOPPED_LOSS",
  OPERATOR_TOOK_PROFIT = "OPERATOR_TOOK_PROFIT",
  OPERATOR_CLOSED_POCKET_DUE_TO_STOP_CONDITION_REACHED = "OPERATOR_CLOSED_POCKET_DUE_TO_STOP_CONDITION_REACHED",
  OPERATOR_MADE_SWAP = "OPERATOR_MADE_SWAP",
  OPERATOR_CLOSED_POCKET_DUE_TO_CONDITION_REACHED = "OPERATOR_CLOSED_POCKET_DUE_TO_CONDITION_REACHED",
  USER_CLOSED_POSITION = "USER_CLOSED_POSITION",
  USER_CLOSED_POCKET = "USER_CLOSED_POCKET",
  USER_CREATED_POCKET = "USER_CREATED_POCKET",
  USER_UPDATED_POCKET = "USER_UPDATED_POCKET",
  USER_DEPOSITED_ASSET = "USER_DEPOSITED_ASSET",
  USER_WITHDREW_ASSETS = "USER_WITHDREW_ASSETS",
  USER_PAUSED_POCKET = "USER_PAUSED_POCKET",
  USER_RESTARTED_POCKET = "USER_RESTARTED_POCKET",
}

export interface UpgradeEvent {
  actor: string;
  timestamp: string;
}

export interface UpdateOperatorEvent {
  actor: string;
  target: string;
  value: boolean;
  timestamp: string;
}

export interface UpdateAdminEvent {
  actor: string;
  target: string;
  value: boolean;
  timestamp: string;
}

export interface UpdateTargetEvent {
  actor: string;
  target: string;
  value: boolean;
  timestamp: string;
}

// define update trading stats event
export interface UpdatePocketStatusEvent {
  id: string;
  actor: string;
  status: string;
  reason: EventReason;
  timestamp: string;
}

// define update trading stats event
export interface UpdatePocketEvent {
  id: string;
  actor: string;
  pocket: PocketEntity;
  reason: EventReason;
  timestamp: string;
}

// define update pocket deposit event
export interface UpdateDepositStatsEvent {
  id: string;
  actor: string;
  amount: string;
  coin_type: string;
  reason: EventReason;
  timestamp: string;
}

// define update withdrawal stats event
export interface UpdateWithdrawalStatsEvent {
  id: string;
  actor: string;
  base_coin_amount: string;
  base_coin_type: string;
  target_coin_amount: string;
  target_coin_type: string;
  reason: EventReason;
  timestamp: string;
}

// define update trading stats event
export interface UpdateTradingStatsEvent {
  id: string;
  actor: string;
  swapped_base_coin_amount: string;
  base_coin_type: string;
  received_target_coin_amount: string;
  target_coin_type: string;
  reason: EventReason;
  timestamp: string;
}

// define update close position event
export interface UpdateClosePositionEvent {
  id: string;
  actor: string;
  swapped_target_coin_amount: string;
  target_coin_type: string;
  received_base_coin_amount: string;
  base_coin_type: string;
  reason: EventReason;
  timestamp: string;
}
