import { AptosBootingManager } from "./aptos-node/aptos.boot";

const aptosLocalNodeProcess = AptosBootingManager.getInstance();

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
  require("./specs/administration.spec");
  require("./specs/manage.spec");
});
