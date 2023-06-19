import { AptosAccount } from "aptos";

/**
 * @notice Program deployer
 */
export class ProgramDeployer {
  constructor(
    private readonly targetResourceAddress: string,
    private readonly deployerAccount: AptosAccount,
    private readonly nodeUrl: string,
    readonly handler = require("node:child_process")
  ) {}

  public deploy() {
    /**
     * @dev Deploy program
     */
    this.handler.execSync(
      [
        "aptos",
        "move",
        "publish",
        "--assume-yes",
        `--private-key ${
          this.deployerAccount.toPrivateKeyObject().privateKeyHex
        }`,
        `--sender-account ${this.targetResourceAddress}`,
        `--named-addresses hamsterpocket=${
          this.targetResourceAddress
        },deployer=${this.deployerAccount.address().hex()}`,
        `--url ${this.nodeUrl}`,
      ].join(" "),
      { stdio: "inherit" }
    );
  }
}
