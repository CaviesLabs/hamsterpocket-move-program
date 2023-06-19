import dotenv from "dotenv";

dotenv.config();

import {
  AptosAccount,
  AptosClient,
  CoinClient,
  HexString,
  FaucetClient,
} from "aptos";
import { ProgramDeployer } from "../../client/libs/program.deployer";

export class AptosBootingManager {
  public static currentInstance: AptosBootingManager | undefined;

  public static APTOS_FAUCET_URL = "https://faucet.testnet.aptoslabs.com";
  public static APTOS_NODE_URL = "https://fullnode.testnet.aptoslabs.com";

  public readonly client: AptosClient;
  public resourceAccountAddress = "";
  private deployerAccount: AptosAccount | undefined;

  private managedAccounts: AptosAccount[] = [];

  private alternativeFaucetAccount = new AptosAccount(
    HexString.ensure(process.env.FAUCET_SECRET_KEY as string).toUint8Array()
  );

  constructor(readonly handler = require("node:child_process")) {
    // initialize client first
    this.client = new AptosClient(AptosBootingManager.APTOS_NODE_URL);
  }

  /**
   * @notice Singleton to get current instance
   */
  public static getInstance(): AptosBootingManager {
    // if available then return current instance
    if (this.currentInstance) {
      return this.currentInstance;
    }

    this.currentInstance = new AptosBootingManager();
    return this.currentInstance;
  }

  /**
   * @notice get deployer account
   */
  public getDeployerAccount() {
    if (this.deployerAccount) {
      return this.deployerAccount;
    }

    this.deployerAccount = new AptosAccount();
    this.managedAccounts.push(this.deployerAccount);

    return this.deployerAccount;
  }

  /**
   * @notice Prepare program to be ready for test
   */
  public async deployProgram(resourceAccount: string) {
    const deployer = this.getDeployerAccount();

    new ProgramDeployer(
      resourceAccount,
      deployer,
      AptosBootingManager.APTOS_NODE_URL
    ).deploy();

    /**
     * @dev Assign resource account
     */
    this.resourceAccountAddress = resourceAccount;

    console.log(`Module deployed at: ${resourceAccount}`);
  }

  /**
   * @notice Funding faucet to an account
   * @param addressHex
   */
  public async fundingWithFaucet(addressHex: string): Promise<void> {
    const faucetClient = new FaucetClient(
      AptosBootingManager.APTOS_NODE_URL,
      AptosBootingManager.APTOS_FAUCET_URL
    );

    try {
      await faucetClient.fundAccount(addressHex, 1e8);
      return;
    } catch (e) {
      console.log(e);
    }

    // check and funding with alternative faucet
    const coinClient = new CoinClient(this.client);

    // transfer from alternative faucet
    await coinClient.transfer(this.alternativeFaucetAccount, addressHex, 1e8, {
      createReceiverIfMissing: true,
    });
    console.log(`funded 1 APTOS with alternative faucet ...`);
  }

  /**
   * @notice Create and fund account
   */
  public async createAndFundAccount() {
    const account = new AptosAccount();

    // push to account registry
    this.managedAccounts.push(account);

    // fund account with faucet
    await this.fundingWithFaucet(account.address().hex());

    return account;
  }

  /**
   * @dev Collect all fees
   */
  public async collectAllFaucet() {
    await Promise.all(
      this.managedAccounts.map(async (account) => {
        // initialize coin client
        const coinClient = new CoinClient(this.client);

        // exec transfer
        return coinClient.transfer(
          account,
          this.alternativeFaucetAccount,
          (await coinClient.checkBalance(account)) - BigInt(1e7)
        );
      })
    );
  }
}
