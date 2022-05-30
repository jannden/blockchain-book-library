# NFT Marketplace

The whole NFT Marketplace.

## Run

1. $ cd frontend
2. $ npm run dev

## Updating the NFT Marketplace contract

If you want to change anything in the ../backend/contracts/NftMarketplaceV2.sol, you have to follow these steps:

1. $ cd backend
2. Update the contract
3. $ npx hardhat deploy --network rinkeby --contract NftMarketplace
4. Copy the contract's deployed address to: ../frontend/utils/deployedContracts.ts and to ../subgraph/subgraph.yaml
5. Copy the whole file from ../backend/artifacts/contracts/NftMarketplaceV2.sol/NftMarketplaceV2.json to ../frontend/contracts
6. Copy just the ABI array from ../backend/artifacts/contracts/NftMarketplaceV2.sol/NftMarketplaceV2.json to ../subgraph/abis/NftMarketplaceV2.json
7. $ cd ../frontend
8. $ npm run compile-contract-types
9. $ cd ../subgraph
10. $ graph codegen
11. $ graph build
12. $ graph deploy --studio nftmarketplace
13. Update the graphUrl in ../frontend/pages/marketplace.tsx
