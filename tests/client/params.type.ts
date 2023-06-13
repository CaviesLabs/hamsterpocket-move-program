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
  UNSET = 0x0,
  CLOSED_WITH_END_TIME = 0x1,
  CLOSED_WITH_BATCH_AMOUNT = 0x2,
  CLOSED_WITH_SPENT_BASE_AMOUNT = 0x3,
  CLOSED_WITH_RECEIVED_TARGET_AMOUNT = 0x4,
}
export interface CreatePocketParams {
  id: string;
  baseTokenAddress: string;
  targetTokenAddress: string;
  amm: AMM;
  startAt: bigint;
  frequency: bigint;
  batchVolume: bigint;
  openPositionConditionOperator: OpenPositionOperator;
  openPositionConditionValueX: bigint;
  openPositionConditionValueY: bigint;
  stopLossConditionStoppedWith: StopConditionStoppedWith;
  stopLossConditionStoppedValue: bigint;
  takeProfitConditionStoppedWith: StopConditionStoppedWith;
  takeProfitConditionStoppedValue: bigint;
  autoCloseConditionClosedWith: AutoCloseConditionClosedWith;
  autoCloseConditionValue: bigint;
}
export interface UpdatePocketParams {
  id: string;
  startAt: bigint;
  frequency: bigint;
  batchVolume: bigint;
  openPositionConditionOperator: OpenPositionOperator;
  openPositionConditionValueX: bigint;
  openPositionConditionValueY: bigint;
  stopLossConditionStoppedWith: StopConditionStoppedWith;
  stopLossConditionStoppedValue: bigint;
  takeProfitConditionStoppedWith: StopConditionStoppedWith;
  takeProfitConditionStoppedValue: bigint;
  autoCloseConditionClosedWith: AutoCloseConditionClosedWith;
  autoCloseConditionValue: bigint;
}
export interface GetPocketParams {
  id: string;
}

export interface SetInteractiveTargetParams {
  target: string;
  value: boolean;
}

export interface SetAllowedOperator {
  target: string;
  value: boolean;
}
