import { AptosClient } from "aptos";

import {
  EventName,
  UpdateAdminEvent,
  UpdateClosePositionEvent,
  UpdateDepositStatsEvent,
  UpdateOperatorEvent,
  UpdatePocketEvent,
  UpdatePocketStatusEvent,
  UpdateTargetEvent,
  UpdateTradingStatsEvent,
  UpdateWithdrawalStatsEvent,
  UpgradeEvent,
} from "./entities/pocket-events.entity";

interface PaginationArgs {
  start: number;
  limit: number;
}

interface Event<T> {
  guid: {
    creation_number: string;
    account_address: string;
  };
  sequence_number: string;
  type: string;
  /**
   * The JSON representation of the event
   */
  data: T;
  eventName: EventName;
}

export class EventIndexer {
  /**
   * @dev Initialize with aptos client
   * @param aptosClient
   * @param resourceAccount
   */
  constructor(
    private readonly aptosClient: AptosClient,
    private readonly resourceAccount: string
  ) {}

  private getEventHandle() {
    return `${this.resourceAccount}::event::EventManager`;
  }

  private async getPocketEvents<T>(
    eventName: EventName,
    queryParams: PaginationArgs
  ) {
    const result = await this.aptosClient.getEventsByEventHandle(
      this.resourceAccount,
      this.getEventHandle(),
      eventName,
      queryParams
    );

    return result.map((r) => ({ ...r, eventName } as Event<T>));
  }

  public getUpgradeEvents(queryParams: PaginationArgs) {
    return this.getPocketEvents<UpgradeEvent>(EventName.Upgrade, queryParams);
  }

  public getUpdateAllowedAdminEvents(queryParams: PaginationArgs) {
    return this.getPocketEvents<UpdateAdminEvent>(
      EventName.UpdateAllowedAdmin,
      queryParams
    );
  }

  public getUpdateAllowedOperatorEvents(queryParams: PaginationArgs) {
    return this.getPocketEvents<UpdateOperatorEvent>(
      EventName.UpdateAllowedOperator,
      queryParams
    );
  }

  public getUpdateAllowedTargetEvents(queryParams: PaginationArgs) {
    return this.getPocketEvents<UpdateTargetEvent>(
      EventName.UpdateAllowedTarget,
      queryParams
    );
  }

  public getCreatePocketEvents(queryParams: PaginationArgs) {
    return this.getPocketEvents<UpdatePocketEvent>(
      EventName.CreatePocket,
      queryParams
    );
  }

  public getUpdatePocketEvents(queryParams: PaginationArgs) {
    return this.getPocketEvents<UpdatePocketEvent>(
      EventName.UpdatePocket,
      queryParams
    );
  }

  public getUpdatePocketStatusEvents(queryParams: PaginationArgs) {
    return this.getPocketEvents<UpdatePocketStatusEvent>(
      EventName.UpdatePocketStatus,
      queryParams
    );
  }

  public getUpdateTradingStatsEvents(queryParams: PaginationArgs) {
    return this.getPocketEvents<UpdateTradingStatsEvent>(
      EventName.UpdateTradingStats,
      queryParams
    );
  }

  public getUpdateClosePositionStats(queryParams: PaginationArgs) {
    return this.getPocketEvents<UpdateClosePositionEvent>(
      EventName.UpdateClosePositionStats,
      queryParams
    );
  }

  public getUpdateDepositStats(queryParams: PaginationArgs) {
    return this.getPocketEvents<UpdateDepositStatsEvent>(
      EventName.UpdateDepositStats,
      queryParams
    );
  }

  public getUpdateWithdrawalStats(queryParams: PaginationArgs) {
    return this.getPocketEvents<UpdateWithdrawalStatsEvent>(
      EventName.UpdateWithdrawalStats,
      queryParams
    );
  }
}
