import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const collectionParams = ["Crypto Zombies", "CZ"];

const setGlobals = async () => {
  const accounts = await ethers.getSigners();

  const NftMarketplaceV2 = await ethers.getContractFactory("NftMarketplaceV2");
  const nftMarketplaceV2 = await NftMarketplaceV2.deploy();
  await nftMarketplaceV2.deployed();

  const NftCollection = await ethers.getContractFactory("NftCollection");

  return { nftMarketplaceV2, NftCollection, accounts };
};

describe("NftMarketplaceV2", function () {
  let nftMarketplaceV2: Contract;
  let NftCollection: ContractFactory;
  let nftCollection: Contract;
  let accounts: Array<SignerWithAddress>;

  before(async function () {
    const globals = await setGlobals();
    nftMarketplaceV2 = globals.nftMarketplaceV2;
    NftCollection = globals.NftCollection;
    accounts = globals.accounts;
  });

  it("Should deploy a collection", async function () {
    const actor = 1;

    nftCollection = await NftCollection.connect(accounts[actor]).deploy(
      ...collectionParams,
      nftMarketplaceV2.address
    );
    await nftCollection.deployed();

    await expect(
      nftMarketplaceV2
        .connect(accounts[actor])
        .addCollection(nftCollection.address)
    )
      .to.emit(nftMarketplaceV2, "CollectionAdded")
      .withArgs(accounts[actor].address, nftCollection.address);
  });

  xit("Should not mint a token from not-owned collection", async function () {
    const collectionId = 0;
    const actor = 2;

    await expect(
      nftMarketplaceV2
        .connect(accounts[actor])
        .mintNftFromCollection(collectionId)
    ).to.be.revertedWith("Collection owner mismatch.");
  });

  xit("Should mint a new token", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const actor = 1;

    const mintNftFromCollection = await nftMarketplaceV2
      .connect(accounts[actor])
      .mintNftFromCollection(collectionId);
    await mintNftFromCollection.wait();

    const collection = await nftMarketplaceV2.collections(collectionId);
    const nftCollection = await NftCollection.attach(
      collection.contractAddress
    );

    const ownerOfToken = await nftCollection.ownerOf(tokenId);

    expect(ownerOfToken).to.equal(accounts[actor].address);
  });

  xit("Should not set not-owned token for sale", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const price = ethers.utils.parseEther("1");
    const fee = ethers.utils.parseEther("0.01");
    const actor = 2;

    await expect(
      nftMarketplaceV2
        .connect(accounts[actor])
        .addMarketItem(collectionId, tokenId, price, { value: fee })
    ).to.be.revertedWith("Token not transferred.");
  });

  xit("Should not set zero-price token for sale", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const price = ethers.utils.parseEther("0");
    const fee = ethers.utils.parseEther("0.01");
    const actor = 1;

    await expect(
      nftMarketplaceV2
        .connect(accounts[actor])
        .addMarketItem(collectionId, tokenId, price, { value: fee })
    ).to.be.revertedWith("Price not set.");
  });

  xit("Should set token for sale", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const marketItemId = 0;
    const price = ethers.utils.parseEther("1");
    const fee = ethers.utils.parseEther("0.01");
    const actor = 1;

    // Collection contract
    const collection = await nftMarketplaceV2.collections(collectionId);
    const nftCollection = await NftCollection.attach(
      collection.contractAddress
    );

    // Transferring ownership
    const transferFrom = await nftCollection
      .connect(accounts[actor])
      .transferFrom(accounts[actor].address, nftMarketplaceV2.address, tokenId);
    await transferFrom.wait();

    expect(await nftCollection.ownerOf(tokenId)).to.equal(
      nftMarketplaceV2.address
    );

    // Listing the item
    const addMarketItem = await nftMarketplaceV2
      .connect(accounts[actor])
      .addMarketItem(collectionId, tokenId, price, { value: fee });
    await addMarketItem.wait();

    const marketItem = await nftMarketplaceV2.marketItems(marketItemId);
    expect(marketItem.collectionId).to.equal(collectionId);
    expect(marketItem.tokenId).to.equal(tokenId);
    expect(marketItem.seller).to.equal(accounts[actor].address);
    expect(marketItem.price).to.equal(price);
  });

  xit("Should list market items", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const marketItemId = 0;
    const price = ethers.utils.parseEther("1");
    const actor = 1;

    const marketItems = await nftMarketplaceV2
      .connect(accounts[actor])
      .fetchMarketItems();
    expect(marketItems[marketItemId].collectionId).to.equal(collectionId);
    expect(marketItems[marketItemId].tokenId).to.equal(tokenId);
    expect(marketItems[marketItemId].seller).to.equal(accounts[actor].address);
    expect(marketItems[marketItemId].price).to.equal(price);
  });

  xit("Should sell market item", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const marketItemId = 0;
    const price = ethers.utils.parseEther("1");
    const actor = 2;

    const provider = waffle.provider;
    const marketItemBefore = await nftMarketplaceV2.marketItems(marketItemId);
    const balanceSellerBefore = await provider.getBalance(
      marketItemBefore.seller
    );
    const balanceBuyerBefore = await provider.getBalance(
      accounts[actor].address
    );

    const sellMarketItem = await nftMarketplaceV2
      .connect(accounts[actor])
      .sellMarketItem(marketItemId, { value: price });
    await sellMarketItem.wait();

    const marketItems = await nftMarketplaceV2
      .connect(accounts[actor])
      .fetchMarketItems();
    expect(marketItems.length).to.equal(0);

    const collection = await nftMarketplaceV2.collections(collectionId);
    const nftCollection = await NftCollection.attach(
      collection.contractAddress
    );
    expect(await nftCollection.ownerOf(tokenId)).to.equal(
      accounts[actor].address
    );

    const marketItemAfter = await nftMarketplaceV2.marketItems(marketItemId);
    expect(marketItemAfter.buyer).to.equal(accounts[actor].address);

    const balanceSellerAfter = await provider.getBalance(
      marketItemBefore.seller
    );
    const balanceBuyerAfter = await provider.getBalance(
      accounts[actor].address
    );
    expect(
      Number(ethers.utils.formatEther(balanceSellerBefore))
    ).to.be.lessThan(Number(ethers.utils.formatEther(balanceSellerAfter)));
    expect(
      Number(ethers.utils.formatEther(balanceBuyerBefore))
    ).to.be.greaterThan(Number(ethers.utils.formatEther(balanceBuyerAfter)));
  });
});
