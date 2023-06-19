import dotenv from "dotenv";

dotenv.config();

import { AptosAccount, HexString } from "aptos";

import {
  RESOURCE_ACCOUNT_SEED,
  TESTNET_NODE_URL,
} from "../client/libs/constants";
import { TransactionSigner } from "../client/transaction.client";
import { TransactionBuilder } from "../client/transaction.builder";
import { ProgramDeployer } from "../client/libs/program.deployer";

async function main() {
  // construct deploy account
  const deployerAccount = new AptosAccount(
    HexString.ensure(process.env.DEPLOYER_SECRET_KEY as string).toUint8Array()
  );

  // create seed
  const accountSeed = `${RESOURCE_ACCOUNT_SEED}-${new Date()
    .getTime()
    .toString()}`;

  // resource account
  const resourceAccount = AptosAccount.getResourceAccountAddress(
    deployerAccount.address().hex(),
    new TextEncoder().encode(accountSeed)
  );

  // create resource account first
  const signer = new TransactionSigner(
    deployerAccount.toPrivateKeyObject().privateKeyHex,
    TESTNET_NODE_URL
  );
  const txBuilder = new TransactionBuilder(signer, resourceAccount.hex());
  await txBuilder
    .buildCreateResourceAccountTransaction({
      ownerAddress: deployerAccount.address().hex(),
      amountToFund: BigInt(1e7 * 5),
      seed: accountSeed,
    })
    .execute();

  // now we deploy program into testnet
  new ProgramDeployer(
    resourceAccount.hex(),
    deployerAccount,
    TESTNET_NODE_URL
  ).deploy();

  console.log(`Module deployed at ${resourceAccount.hex()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
