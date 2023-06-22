import dotenv from "dotenv";

dotenv.config();

import { AptosAccount, HexString } from "aptos";

import { TESTNET_NODE_URL } from "../client/libs/constants";
import { TransactionSigner } from "../client/transaction.client";
import { TransactionBuilder } from "../client/transaction.builder";
import { ProgramDeployer } from "../client/libs/program.deployer";

async function main() {
  // resource account
  const addresses = {
    programAddress:
      "0x9ddf90dff89cc4c6f2cfb4e3d94758ef206b57ce9e2ba9071884a192bff7ff6a",
  };

  // construct deploy account
  const deployerAccount = new AptosAccount(
    HexString.ensure(process.env.DEPLOYER_SECRET_KEY as string).toUint8Array()
  );

  // create resource account first
  const signer = new TransactionSigner(
    deployerAccount.toPrivateKeyObject().privateKeyHex,
    TESTNET_NODE_URL
  );
  const txBuilder = new TransactionBuilder(signer, addresses.programAddress);
  console.log(`Module loaded at ${addresses.programAddress}`);

  // now we generate upgrade payload
  const payload = new ProgramDeployer(
    addresses.programAddress,
    deployerAccount,
    TESTNET_NODE_URL
  ).generateUpgradePayload();

  // now we publish/upgrade package
  const tx = await txBuilder
    .buildUpgradeTransaction({
      serializedMetadata: payload.args[0].value,
      code: payload.args[1].value,
    })
    .execute();

  console.log(`program upgraded at tx: ${tx.txId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
