import { AptosBootingManager } from "./aptos-node/aptos.boot";

const aptosLocalNodeProcess = new AptosBootingManager();

describe("hamsterpocket", function () {
  jest.setTimeout(60000);

  beforeAll(async () => {
    await aptosLocalNodeProcess.bootAptosNode();
    await aptosLocalNodeProcess.prepareProgram();
  });

  afterAll(async () => {
    await aptosLocalNodeProcess.destroyAptosNode();
  });

  require("./specs/faucet.spec");
  require("./specs/deployment.spec");
});
