import {
  AMM,
  AutoCloseConditionClosedWith,
  OpenPositionOperator,
  StopConditionStoppedWith,
} from "./entities/pocket.entity";

export interface DepositParams {
  id: string;
  tokenAddress: string;
  amount: bigint;
}

export interface WithdrawParams {
  id: string;
  baseTokenAddress: string;
  targetTokenAddress: string;
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
