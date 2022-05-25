import hre, { ethers } from "hardhat";

async function deployContract(contract: string) {
  try {
    await hre.run("compile", {
      message: "Compiled successfully",
    });

    // Get constructor arguments if any
    const { constructorArgs } = require("./constructorArguments.ts");

    // Set the provider for localhost
    // const provider = new hre.ethers.providers.JsonRpcProvider("http://localhost:8545");

    // Set the provider for Rinkeby
    // const provider = new hre.ethers.providers.InfuraProvider("rinkeby", "40c2813049e44ec79cb4d7e0d18de173")

    // Set the wallet through provider
    // const wallet = new hre.ethers.Wallet("....privateKey.....", provider);

    // Set the wallet through hardhat.config.ts
    const [wallet] = await ethers.getSigners();

    // Deployer info
    console.log(
      `Deploying contract ${contract} with the account: ${wallet.address}`
    );

    // Deploy and create contract instance of a contract using JSON import
    // HOW ???

    // Deploy and create contract instance of a contract using hardhat contract factory (if the contract was compiled by Hardhat in the current project)
    const ContractFactory = await ethers.getContractFactory(contract);
    const contractInstance = await ContractFactory.deploy(
      ...(constructorArgs[contract] || [])
    );
    await contractInstance.deployed();

    // Create contract instance of an already deployed contract using JSON import
    // const BookLibrary = require('./artifacts/contracts/USElection.sol/USElection.json')
    // const bookLibrary = new hre.ethers.Contract("....contractAddress.....", BookLibrary.abi, wallet);

    // Create contract instance of an already deployed contract using hardhat contract factory (if the contract was compiled by Hardhat in the current project)
    // const BookLibrary = await hre.ethers.getContractFactory("USElection");
    // const bookLibrary = await BookLibrary.attach("0xc9707E1e496C12f1Fa83AFbbA8735DA697cdBf64");

    // Printing info: console.log and hre.run("print",...) can be used interchangeably
    await hre.run("print", {
      message: "Deployed successfully",
    });
    console.log("Contract deployed to:", contractInstance.address);

    // Verifying contract on EtherScan.io
    if (hre.hardhatArguments.network === "rinkeby") {
      await contractInstance.deployTransaction.wait(6);
      await hre.run("verify:verify", {
        address: contractInstance.address,
        constructorArguments: [...(constructorArgs[contract] || [])],
      });
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

module.exports = deployContract;
