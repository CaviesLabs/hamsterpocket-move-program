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
  openPositionCondition: [OpenPositionOperator, bigint, bigint];
  stopLossCondition: [StopConditionStoppedWith, bigint];
  takeProfitCondition: [StopConditionStoppedWith, bigint];
  autoClosedConditions: [AutoCloseConditionClosedWith, bigint][];
}

export interface UpdatePocketParams {
  id: string;
  startAt: bigint;
  frequency: bigint;
  batchVolume: bigint;
  openPositionCondition: [OpenPositionOperator, bigint, bigint];
  stopLossCondition: [StopConditionStoppedWith, bigint];
  takeProfitCondition: [StopConditionStoppedWith, bigint];
  autoClosedConditions: [AutoCloseConditionClosedWith, bigint][];
}

export interface GetPocketParams {
  id: string;
}

export interface SetInteractiveTargetParams {
  target: string;
  value: boolean;
}

export interface SetAllowedOperatorParams {
  target: string;
  value: boolean;
}

export interface CreateResourceAccountParams {
  seed: string;
  ownerAddress: string;
  amountToFund: bigint;
}
