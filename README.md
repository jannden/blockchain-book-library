# NFT Marketplace

This project consists of a backend, frontend, and subgraph to create a comprehensive NFT marketplace ecosystem. Users can mint, list, buy, and sell NFTs seamlessly.

## Project Structure

- **Backend:** Smart contracts for the NFT collection and marketplace.
- **Frontend:** Next.js application for interacting with the smart contracts.
- **Subgraph:** Subgraph using The Graph to gather blockchain data.

## Features

- **Mint NFTs:** Create new NFTs and add them to your collection.
- **List NFTs:** List your NFTs for sale in the marketplace.
- **Buy NFTs:** Purchase listed NFTs from other users.
- **Cancel Listings:** Cancel your NFT listings.

## Setup
### Follow the setup instructions in each of the subdirectories in this order: `backend`, `subgraph`, and `frontend`.

#### Example workflow when updating the NftMarketplaceV2 contract
If you want to change anything in the contract `backend/contracts/NftMarketplaceV2.sol`, you have to follow these steps:

1. `$ cd backend`
2. Update the contract
3. `$ bunx hardhat deploy --network sepolia --contract NftMarketplaceV2`
4. Copy the contract's deployed address to: `frontend/utils/deployedContracts.ts` and to `subgraph/subgraph.yaml`
5. Copy the whole file from `backend/artifacts/contracts/NftMarketplaceV2.sol/NftMarketplaceV2.json` to `frontend/contracts`
6. Copy just the ABI array from `backend/artifacts/contracts/NftMarketplaceV2.sol/NftMarketplaceV2.json` to `subgraph/abis/NftMarketplaceV2.json`
7. `$ cd ../frontend`
8. `$ bun run compile-contract-types`
9. `$ cd ../subgraph`
10. `$ graph codegen`
11. `$ graph build`
12. `$ graph deploy --studio <YOUR_SUBGRAPH_NAME>`
13. Update the `graphUrl` in `frontend/utils/util.ts`

#### Example workflow when updating the NftCollection contract

1. Update the `NftCollection.sol` contract in `backend/contracts`.
2. Run `$ npx hardhat compile`.
3. Copy the artifact from `backend/artifacts/contracts/NftCollection.sol/NftCollection.json` to the frontend here: `frontend/contracts/NftCollection.json`.
4. Copy just the ABI from the artifact from `backend/artifacts/contracts/NftCollection.sol/NftCollection.json` to the Graph here: `subgraph/abis/NftCollection.json`.
5. Run `$ npm run compile-contract-types` in the frontend.
