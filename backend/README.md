# Advanced Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with smart contracts, tests with 100% coverage, and a script that deploys that contract and verifies it on Etherscan.

Install dependencies:

```shell
bun install
```

Fill out the `.env` file with the required information.

Deploy the contract to the Sepolia network:

```shell
bunx hardhat deploy --network sepolia --contract NftMarketplaceV2
```

Also try running some of the following tasks:

```shell
bunx hardhat accounts
bunx hardhat compile
bunx hardhat clean
bunx hardhat test
bunx hardhat node
bunx hardhat help
bunx hardhat coverage
REPORT_GAS=true bunx hardhat test
bunx eslint '**/*.{js,ts}'
bunx eslint '**/*.{js,ts}' --fix
bunx prettier '**/*.{json,sol,md}' --check
bunx prettier '**/*.{json,sol,md}' --write
bunx solhint 'contracts/**/*.sol'
bunx solhint 'contracts/**/*.sol' --fix
bunx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```
