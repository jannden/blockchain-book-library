import hre, { ethers } from "hardhat";

async function deployContract(contract: string) {
  console.log("Deploying contract: ", contract);

  try {
    await hre.run("compile", {
      message: "Compiled successfully",
    });

    // Get constructor arguments if any
    const { constructorArgs } = require("./constructorArguments.ts");

    // Set the provider for localhost
    // const provider = new hre.ethers.providers.JsonRpcProvider("http://localhost:8545");

    // Set the provider for Sepolia
    // const provider = new hre.ethers.providers.InfuraProvider("...network...", "...infuraKey...")

    // Set the wallet through provider
    // const wallet = new hre.ethers.Wallet("...privateKey...", provider);

    // Set the wallet through hardhat.config.ts
    const [wallet] = await ethers.getSigners();

    // Deployer info
    console.log(
      `Deploying contract ${contract} with the account: ${wallet.address}`,
    );

    // Deploy and create contract instance of a contract using JSON import
    // TODO

    // Deploy and create contract instance of a contract using hardhat contract factory (if the contract was compiled by Hardhat in the current project)
    const ContractFactory = await ethers.getContractFactory(contract);
    const contractInstance = await ContractFactory.deploy(
      ...(constructorArgs?.[contract] || []),
    );
    await contractInstance.deployed();

    // Printing info: console.log and hre.run("print",...) can be used interchangeably
    await hre.run("print", {
      message: "Deployed successfully",
    });
    console.log("Contract deployed to:", contractInstance.address);

    // Verifying contract on EtherScan.io
    if (hre.hardhatArguments.network === "sepolia") {
      console.log("Verifying contract on EtherScan...");
      await contractInstance.deployTransaction.wait(6);
      await hre.run("verify:verify", {
        address: contractInstance.address,
        constructorArguments: [...(constructorArgs[contract] || [])],
      });
    }

    console.log("Done with deployment!");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

module.exports = deployContract;
