import { AptosAccount } from "aptos";
import * as fs from "fs";

interface PublishPayload {
  function_id: string;
  type_args: any[];
  args: [{ type: string; value: string }, { type: string; value: string[] }];
}

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

  public generateUpgradePayload() {
    /**
     * @dev Deploy program
     */
    this.handler.execSync(
      [
        "aptos",
        "move",
        "build-publish-payload",
        "--assume-yes",
        `--named-addresses hamsterpocket=${
          this.targetResourceAddress
        },deployer=${this.deployerAccount.address().hex()}`,
        `--json-output-file out.json`,
      ].join(" "),
      { stdio: "inherit" }
    );

    // the file will be generated after the above command
    const payloadStr = fs.readFileSync("./out.json").toString("utf-8");
    return JSON.parse(payloadStr) as PublishPayload;
  }
}
