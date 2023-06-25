import {
  AMM,
  AutoCloseConditionClosedWith,
  OpenPositionOperator,
  StopConditionStoppedWith,
} from "./entities/pocket.entity";

export interface DepositParams {
  id: string;
  coinType: string;
  amount: bigint;
}

export interface ProgramUpgradeParams {
  serializedMetadata: string;
  code: string[];
}

export interface ExecTradingParams {
  id: string;
  baseCoinType: string;
  targetCoinType: string;
  minAmountOut: bigint;
}

export interface WithdrawParams {
  id: string;
  baseCoinType: string;
  targetCoinType: string;
}

export interface CreatePocketParams {
  id: string;
  baseCoinType: string;
  targetCoinType: string;
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

export interface GetMultiplePocketsParams {
  idList: string[];
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

export interface SetAllowedAdminParams {
  target: string;
}

export interface CreateResourceAccountParams {
  seed: string;
  ownerAddress: string;
  amountToFund: bigint;
}

export interface GetQuoteParams {
  baseCoinType: string;
  targetCoinType: string;
  amountIn: bigint;
}
