import { AptosClient } from "aptos";

interface PaginationArgs {
  start?: bigint | number;
  limit?: number;
}

export class EventsIndexer {
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

  public getCreatePocketEvents(queryParams: PaginationArgs) {
    return this.aptosClient.getEventsByEventHandle(
      this.resourceAccount,
      this.getEventHandle(),
      "create_pocket",
      queryParams
    );
  }
}
