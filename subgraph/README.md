# NFT Marketplace Subgraph Database

This subgraph uses The Graph to gather data about the blockchain for the NFT Marketplace.

## Setup

### Installation
Install the dependencies with yarn:
   ```sh
   yarn install
   ```

### Configuration

1. **Update Marketplace Address:**
   Modify `subgraph/subgraph.yaml` with the deployed marketplace address (NftMarketplaceV2).

2. **Copy ABI:**
Copy just the ABI array from `../backend/artifacts/contracts/NftMarketplaceV2.sol/NftMarketplaceV2.json` to `subgraph/abis/NftMarketplaceV2.json`. Important: copy just the ABI array, not the whole file even though the filenames are the same.

Do the same for the NftCollection contract.

### Deploying the Subgraph

If you don't have a subgraph already set up, you just need to install the Graph CLI:
```sh
npm install -g @graphprotocol/graph-cli
```

And authenticate:
```sh
graph init --studio <SUBGRAPH_SLUG>
```

Once that's out of the way, you can deploy the subgraph:


1. **Generate Code:**
   ```sh
   graph codegen
   ```

2. **Build the Subgraph:**
   ```sh
   graph build
   ```

3. **Deploy the Subgraph:**
   ```sh
   graph deploy --studio <YOUR_SUBGRAPH_NAME>
   ```

### Frontend Configuration

Update the `graphUrl` in `../frontend/utils/util.ts` with your deployed subgraph URL.