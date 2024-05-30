# NFT Marketplace Next.js Frontend

This is a Next.js frontend application for interacting with the NFT Marketplace and NFT Collection smart contracts. It allows users to mint, list, buy, and sell NFTs seamlessly.

## Features

- **Mint NFTs:** Create new NFTs and add them to your collection.
- **List NFTs:** List your NFTs for sale in the marketplace.
- **Buy NFTs:** Purchase listed NFTs from other users.
- **Cancel Listings:** Cancel your NFT listings.

## Installation

### 1. Install dependencies:
Preferably use `bun` to install the dependencies:
```sh
bun install
```

### 2. Configure the Environment:
Create a `.env.development` and `.env.production`  based on the `.env.example` file. Fill in the required values.

### 3. Update the Contract Addresses:
Follow the instructions in the backend README to compile and deploy the NFT Marketplace contract.

Update the contract address of NftMarketplaceV2 in `utils/deployedContracts.ts` with the address of your deployed contract.

Add the full contract ABIs (in JSON format) to the `contracts` folder. You can find the ABIs in the `artifacts` folder of the `../backend` project.

### 4. Compile Types from ABIs:
```sh
bun run compile-contract-types
```

You can import these types so that you know the function params and return types of the methods, among other helpful things. For example:

```ts
import MY_CONTRACT_ABI from "../contracts/MY_CONTRACT.json";
import type { MY_CONTRACT } from "../contracts/types";
import useContract from "./useContract";

export default function useMyContract() {
  return useContract<MY_CONTRACT>(CONTRACT_ADDRESS, MY_CONTRACT_ABI);
}
```

### 5. Update the Graph URL:
Follow the instructions in the subgraph README to deploy the subgraph.
Update the `graphUrl` in `utils/util.ts` with the URL of your deployed subgraph.

## Running the Application

```sh
bun run dev
```

Open [http://localhost:4001](http://localhost:4001) with your browser to see the result.