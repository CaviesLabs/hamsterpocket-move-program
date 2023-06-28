import dotenv from "dotenv";

dotenv.config();

import { AptosAccount, HexString } from "aptos";

import {
  MAINNET_NODE_URL,
  RESOURCE_ACCOUNT_SEED,
} from "../client/libs/constants";
import { TransactionSigner } from "../client/transaction.client";
import { TransactionBuilder } from "../client/transaction.builder";
import { ProgramDeployer } from "../client/libs/program.deployer";

async function main() {
  // construct deploy account
  const deployerAccount = new AptosAccount(
    HexString.ensure(process.env.DEPLOYER_SECRET_KEY as string).toUint8Array()
  );

  const addresses = {
    aptos: "0x1::aptos_coin::AptosCoin",
    usdc: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
    cake: "0x159df6b7689437016108a019fd5bef736bac692b6d4a1f10c941f6fbb9a74ca6::oft::CakeOFT",
  };

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
    MAINNET_NODE_URL
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
    MAINNET_NODE_URL
  ).deploy();

  // whitelist
  await txBuilder
    .buildSetInteractiveTargetTransaction({
      target: addresses.usdc,
      value: true,
    })
    .execute();
  await txBuilder
    .buildSetInteractiveTargetTransaction({
      target: addresses.aptos,
      value: true,
    })
    .execute();
  await txBuilder
    .buildSetInteractiveTargetTransaction({
      target: addresses.cake,
      value: true,
    })
    .execute();

  // set operator
  await txBuilder
    .buildSetOperatorTransaction({
      target: deployerAccount.address().hex(),
      value: true,
    })
    .execute();

  console.log(`Module deployed at ${resourceAccount.hex()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
