# NFT Marketplace Hardhat Backend

This project consists of two main smart contracts: `NftCollection` and `NftMarketplaceV2`. Together, these contracts create a comprehensive NFT ecosystem where users can mint, list, buy, and sell NFTs. The marketplace contract also manages listing fees and interactions between buyers and sellers.

## Contracts

### 1. NftMarketplaceV2

The `NftMarketplaceV2` contract is a marketplace for listing and trading NFTs. It supports listing fees, buying, and canceling listings. Users can also add their NFT collections to the marketplace.

#### Features:
- **Listing and Buying:** Users can list their NFTs for sale and buy listed NFTs.
- **Canceling Listings:** Listings can be canceled by the owner of the NFT or the marketplace owner.
- **Listing Fee:** A configurable listing fee is required to list an NFT.
- **Collection Management:** Users can add their deployed NFT collections to the marketplace.

#### Events:
- `ItemListed`: Emitted when an NFT is listed for sale.
- `ItemCanceled`: Emitted when a listing is canceled.
- `ItemBought`: Emitted when an NFT is bought.
- `CollectionAdded`: Emitted when a new NFT collection is added to the marketplace.

#### Functions:
- `listItem(address _nftAddress, uint256 _tokenId, uint256 _price)`: Lists an NFT for sale with the specified price.
- `cancelListing(address _nftAddress, uint256 _tokenId)`: Cancels a listed NFT.
- `buyItem(address _nftAddress, uint256 _tokenId)`: Buys a listed NFT.
- `addCollection(address _nftAddress)`: Adds an NFT collection to the marketplace.
- `setListingFee(uint256 _newFee)`: Sets a new listing fee.

### 2. NftCollection

The `NftCollection` contract is an ERC721 implementation that allows the owner to mint NFTs with specific URIs. It integrates with a marketplace to automatically cancel listings when an NFT is transferred.

#### Features:
- **Minting:** Only the owner can mint new NFTs.
- **Token URI Management:** Each token has a URI that can be set during minting.
- **Marketplace Integration:** Automatically cancels a listing in the marketplace when the NFT is transferred.
- **ERC721 Extensions:** Supports burnable tokens, enumerable tokens, and URI storage.

#### Functions:
- `safeMint(address _to, string memory _uri)`: Mints a new token to the specified address with the given URI.
- `_afterTokenTransfer(address _from, address _to, uint256 _tokenId, uint256 amount)`: Checks if the token is listed in the marketplace and cancels the listing if it is.

## Setup

To get started with this project, follow these steps:

### 1. Install dependencies:
  Preferably use `bun` to install the dependencies:
  ```sh
  bun install
  ```

  Or use npm if you prefer:
  ```sh
  npm install
  ```

  Similary, choose `bunx` or `npx` for the other commands.

### 2. Set env variables:
  Fill out the `.env` file with the required information based on the `.env.example` file.

### 3. Run tests:
  ```sh
  npx hardhat test
  ```

  You can also check the test coverage:
  ```sh
  npx hardhat coverage
  ```


### 4. Deploy:
  If you want to deploy to your local node, start the node first:
  
  ```shell
  bunx hardhat node
  ```

  Then deploy the contract:
  
  ```shell
  bunx hardhat deploy --network localhost --contract NftMarketplaceV2
  ```

  Deploy the `NftMarketplaceV2` contract to the blockchain network, for example Sepolia:

  ```shell
  bunx hardhat deploy --network sepolia --contract NftMarketplaceV2
  ```

  **Note 1:** Make sure to note down the contract address for the frontend application.
  **Note 2:** The contract will automatically be verified on Etherscan if the API key is provided in the `.env` file.
  **Note 3:** There is no need to deploy the `NftCollection` contract, as it is deployed by users on the frontend.

## Usage

After deploying the marketplace, you can interact with it through the frontend application.
