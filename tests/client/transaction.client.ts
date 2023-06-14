import { AptosAccount, AptosClient, HexString } from "aptos";

import { RESOURCE_ACCOUNT_SEED } from "./libs/constants";

/**
 * @notice Transaction client to send transaction to aptos blockchain
 */
export class TransactionSigner {
  private readonly account: AptosAccount;
  private readonly client: AptosClient;

  /**
   * @dev Initialize transaction signer
   * @param privateKey
   * @param nodeUrl
   */
  constructor(
    private readonly privateKey: string,
    private readonly nodeUrl: string
  ) {
    this.account = new AptosAccount(
      HexString.ensure(privateKey).toUint8Array()
    );

    this.client = new AptosClient(nodeUrl);
  }

  /**
   * @notice Sign and send message
   * @param payload
   * @param waitForTx
   */
  public async signAndSendTransaction(payload: any, waitForTx: boolean) {
    const rawTx = await this.client.generateRawTransaction(
      this.account.address(),
      payload
    );
    const result = await this.client.simulateTransaction(this.account, rawTx);

    if (!result[0].success) {
      throw new Error(`${result[0].vm_status}`);
    }

    /**
     * @dev Sign and try to simulate transaction to make sure it will be a success one
     */
    const signedTx = await this.client.signAndSubmitTransaction(
      this.account,
      rawTx
    );

    /**
     * @dev Wait for transaction if needed
     */
    if (waitForTx) {
      await this.client.waitForTransaction(signedTx, { checkSuccess: true });
    }

    return signedTx;
  }

  /**
   * @notice Read program state from
   */
  public async view(payload: any) {
    return this.client.view(payload);
  }

  /**
   * @notice get current signer address
   */
  public getAddress() {
    return this.account.address();
  }

  /**
   * @notice Expose client for external use
   */
  public getClient() {
    return this.client;
  }

  /**
   * @notice Get hamster pocket resource account
   */
  public getHamsterpocketResourceAccount() {
    return AptosAccount.getResourceAccountAddress(
      this.account.address().hex(),
      new TextEncoder().encode(RESOURCE_ACCOUNT_SEED)
    );
  }
}
