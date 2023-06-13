import { ChildProcessWithoutNullStreams } from "child_process";

import { UtilsProvider } from "./utils.provider";

export class AptosBootingManager {
  private currentProcess: ChildProcessWithoutNullStreams | undefined;

  public static PRIVATE_KEY =
    "0xeaa4eea8ac8048dfd7e3da319ad0834f9a10b171d2186318255f451b5baf6d90";
  public static PUBLIC_KEY =
    "0xfd03e78d1351c7efb5fc82a152ed32f3fc94bf045e25be98b1433da2230c594e";
  public static MAIN_ACCOUNT_ADDRESS =
    "1e5320d3a1a12f28c22a52b62a3815cbf0efc49020089d350454f1d3fd53fd90";
  public static RESOURCE_ACCOUNT_ADDRESS =
    "93978b7674234c90003f608e7f33856c652edcaeb8280584ae44c61ea1b2539a";
  public static APTOS_FAUCET_URL = "http://127.0.0.1:8081/";
  public static APTOS_NODE_URL = "http://127.0.0.1:8080/";

  constructor(private readonly handler = require("node:child_process")) {}

  /**
   * @notice Start aptos node
   */
  public async bootAptosNode() {
    this.currentProcess = await this.handler.spawn("aptos", [
      "node",
      "run-local-testnet",
      "--with-faucet",
      "--assume-yes",
      "--force-restart",
    ]);

    this.currentProcess?.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    this.currentProcess?.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`);
    });

    this.currentProcess?.on("error", (error) => {
      console.log(`error: ${error.message}`);
    });

    this.currentProcess?.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });

    await new UtilsProvider().pause(20);
  }

  /**
   * @notice Destroy aptos node after all test have been running
   */
  public async destroyAptosNode() {
    if (this.currentProcess) {
      console.log("exiting process");
      this.currentProcess.kill("SIGTERM");
    }

    await new UtilsProvider().pause(3);
  }

  /**
   * @notice Prepare program to be ready for test
   */
  public async prepareProgram() {
    /**
     * @dev Funding account
     */
    this.handler.execSync(
      [
        "aptos",
        "account",
        "fund-with-faucet",
        `--account ${AptosBootingManager.MAIN_ACCOUNT_ADDRESS}`,
        `--faucet-url ${AptosBootingManager.APTOS_FAUCET_URL}`,
        `--url ${AptosBootingManager.APTOS_NODE_URL}`,
      ].join(" "),
      { stdio: "inherit" }
    );

    /**
     * @dev Create resource account
     */
    this.handler.execSync(
      [
        `aptos`,
        `move`,
        `run`,
        `--assume-yes`,
        `--function-id '0x1::resource_account::create_resource_account_and_fund'`,
        `--args 'string:hamsterpocket' 'hex:${AptosBootingManager.MAIN_ACCOUNT_ADDRESS}' 'u64:10000000'`,
        `--url ${AptosBootingManager.APTOS_NODE_URL}`,
        `--private-key ${AptosBootingManager.PRIVATE_KEY}`,
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
        `--private-key ${AptosBootingManager.PRIVATE_KEY}`,
        `--sender-account ${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS}`,
        `--named-addresses hamsterpocket=${AptosBootingManager.RESOURCE_ACCOUNT_ADDRESS},deployer=${AptosBootingManager.MAIN_ACCOUNT_ADDRESS}`,
        `--url ${AptosBootingManager.APTOS_NODE_URL}`,
      ].join(" "),
      { stdio: "inherit" }
    );
  }
}
