import { AptosAccount } from "aptos";

import { AptosBootingManager } from "./aptos-node/aptos.boot";
import { RESOURCE_ACCOUNT_SEED } from "./client/libs/constants";
import { TransactionSigner } from "./client/transaction.client";
import { TransactionBuilder } from "./client/transaction.builder";

const aptosLocalNodeProcess = AptosBootingManager.getInstance();

describe("hamsterpocket", function () {
  jest.setTimeout(600000);

  beforeAll(async () => {
    // get and funding deployer account
    const deployerAccount = aptosLocalNodeProcess.getDeployerAccount();
    await aptosLocalNodeProcess.fundingWithFaucet(
      deployerAccount.address().hex()
    );

    // resource account
    const resourceAccount = AptosAccount.getResourceAccountAddress(
      deployerAccount.address().hex(),
      new TextEncoder().encode(RESOURCE_ACCOUNT_SEED)
    );

    // create resource account first
    const signer = new TransactionSigner(
      deployerAccount.toPrivateKeyObject().privateKeyHex,
      AptosBootingManager.APTOS_NODE_URL
    );
    const txBuilder = new TransactionBuilder(signer, null);
    await txBuilder
      .buildCreateResourceAccountTransaction({
        ownerAddress: deployerAccount.address().hex(),
        amountToFund: BigInt(1e7 * 5),
        seed: RESOURCE_ACCOUNT_SEED,
      })
      .execute();

    // now we deploy program into testnet
    await aptosLocalNodeProcess.deployProgram(
      deployerAccount.address().hex(),
      resourceAccount.hex(),
      deployerAccount.toPrivateKeyObject().privateKeyHex
    );
  });

  afterAll(async () => {
    await aptosLocalNodeProcess.collectAllFaucet();
  });

  // side specs
  require("./specs/account.spec");
  require("./specs/faucet.spec");
  require("./specs/deployment.spec");

  // main specs
  require("./specs/manage.spec");
  require("./specs/vault.spec");
  require("./specs/swap.spec");

  // should be the last to run
  require("./specs/administration.spec");
});
