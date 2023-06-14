import { AptosAccount, AptosClient } from "aptos";

export class AptosBootingManager {
  public static currentInstance: AptosBootingManager | undefined;

  public static APTOS_FAUCET_URL = "https://faucet.testnet.aptoslabs.com";
  public static APTOS_NODE_URL = "https://fullnode.testnet.aptoslabs.com";

  public client: AptosClient | undefined;
  public resourceAccountAddress = "";
  private deployerAccount: AptosAccount | undefined;

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
    return this.deployerAccount;
  }

  /**
   * @notice Prepare program to be ready for test
   */
  public async deployProgram(
    deployerAccount: string,
    resourceAccount: string,
    privateKey: string
  ) {
    /**
     * @dev Funding account
     */
    this.handler.execSync(
      [
        "aptos",
        "account",
        "fund-with-faucet",
        `--account ${resourceAccount}`,
        `--faucet-url ${AptosBootingManager.APTOS_FAUCET_URL}`,
        `--url ${AptosBootingManager.APTOS_NODE_URL}`,
      ].join(" "),
      { stdio: "inherit" }
    );

    /**
     * @dev Deploy program
     */
    this.handler.execSync(
      [
        "aptos",
        "move",
        "publish",
        "--assume-yes",
        `--private-key ${privateKey}`,
        `--sender-account ${resourceAccount}`,
        `--named-addresses hamsterpocket=${resourceAccount},deployer=${deployerAccount}`,
        `--url ${AptosBootingManager.APTOS_NODE_URL}`,
      ].join(" "),
      { stdio: "inherit" }
    );

    /**
     * @dev Assign resource account
     */
    this.resourceAccountAddress = resourceAccount;
  }

  /**
   * @notice Funding faucet to an account
   * @param addressHex
   */
  public async fundingWithFaucet(addressHex: string): Promise<void> {
    return Promise.resolve(
      this.handler.execSync(
        [
          "aptos",
          "account",
          "fund-with-faucet",
          `--account ${addressHex}`,
          `--faucet-url ${AptosBootingManager.APTOS_FAUCET_URL}`,
          `--url ${AptosBootingManager.APTOS_NODE_URL}`,
        ].join(" "),
        { stdio: "inherit" }
      )
    );
  }
}
