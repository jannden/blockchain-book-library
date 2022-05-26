import * as dotenv from "dotenv";

import { HardhatUserConfig, task, subtask } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "isomorphic-fetch";

dotenv.config();

// Tasks

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const defaultContract = "NftMarketplace";

task("deploy", "Deploys contract on a provided network")
  .addOptionalParam("contract", "The contract to deploy", defaultContract)
  .setAction(async ({ contract }) => {
    const deployContract = require("./scripts/deploy.ts");
    await deployContract(contract);
  });

subtask("print", "Prints a message")
  .addParam("message", "The message to print")
  .setAction(async (taskArgs) => {
    console.log(taskArgs.message);
  });

// Config

interface HardhatCustomConfig extends HardhatUserConfig {
  settings?: { optimizer: { enabled: boolean; runs: number } };
}

const config: HardhatCustomConfig = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts: [
        process.env.PRIVATE_KEY_1 || "",
        process.env.PRIVATE_KEY_2 || "",
      ],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
