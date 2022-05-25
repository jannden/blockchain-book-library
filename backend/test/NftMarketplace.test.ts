import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const collectionParams = ["Crypto Zombies", "CZ"];

describe("BookLibraryV2", function () {
  let nftMarketplace: Contract;
  let NftCollection: ContractFactory;
  let accounts: Array<SignerWithAddress>;

  before(async function () {
    accounts = await ethers.getSigners();

    const NftMarketplace = await ethers.getContractFactory("NftMarketplace");
    nftMarketplace = await NftMarketplace.deploy();
    await nftMarketplace.deployed();

    NftCollection = await ethers.getContractFactory("NftCollection");
  });

  it("Should create a collection", async function () {
    const actor = 1;

    const createCollection = await nftMarketplace
      .connect(accounts[actor])
      .createCollection(...collectionParams);
    await createCollection.wait();

    const collection = await nftMarketplace.collections(0);
    expect(collection.owner).to.equal(accounts[actor].address);
  });

  it("Should not mint a token from not-owned collection", async function () {
    const collectionId = 0;
    const actor = 2;

    await expect(
      nftMarketplace
        .connect(accounts[actor])
        .mintNftFromCollection(collectionId)
    ).to.be.revertedWith("Collection owner mismatch.");
  });

  it("Should mint a new token", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const actor = 1;

    const mintNftFromCollection = await nftMarketplace
      .connect(accounts[actor])
      .mintNftFromCollection(collectionId);
    await mintNftFromCollection.wait();

    const collection = await nftMarketplace.collections(collectionId);
    const nftCollection = await NftCollection.attach(
      collection.contractAddress
    );

    const ownerOfToken = await nftCollection.ownerOf(tokenId);

    expect(ownerOfToken).to.equal(accounts[actor].address);
  });

  it("Should not set not-owned token for sale", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const price = ethers.utils.parseEther("1");
    const fee = ethers.utils.parseEther("0.01");
    const actor = 2;

    await expect(
      nftMarketplace
        .connect(accounts[actor])
        .addMarketItem(collectionId, tokenId, price, { value: fee })
    ).to.be.revertedWith("Token not transferred.");
  });

  it("Should not set zero-price token for sale", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const price = ethers.utils.parseEther("0");
    const fee = ethers.utils.parseEther("0.01");
    const actor = 1;

    await expect(
      nftMarketplace
        .connect(accounts[actor])
        .addMarketItem(collectionId, tokenId, price, { value: fee })
    ).to.be.revertedWith("Price not set.");
  });

  it("Should set token for sale", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const marketItemId = 0;
    const price = ethers.utils.parseEther("1");
    const fee = ethers.utils.parseEther("0.01");
    const actor = 1;

    // Collection contract
    const collection = await nftMarketplace.collections(collectionId);
    const nftCollection = await NftCollection.attach(
      collection.contractAddress
    );

    // Transferring ownership
    const transferFrom = await nftCollection
      .connect(accounts[actor])
      .transferFrom(accounts[actor].address, nftMarketplace.address, tokenId);
    await transferFrom.wait();

    expect(await nftCollection.ownerOf(tokenId)).to.equal(
      nftMarketplace.address
    );

    // Listing the item
    const addMarketItem = await nftMarketplace
      .connect(accounts[actor])
      .addMarketItem(collectionId, tokenId, price, { value: fee });
    await addMarketItem.wait();

    const marketItem = await nftMarketplace.marketItems(marketItemId);
    expect(marketItem.collectionId).to.equal(collectionId);
    expect(marketItem.tokenId).to.equal(tokenId);
    expect(marketItem.seller).to.equal(accounts[actor].address);
    expect(marketItem.price).to.equal(price);
  });

  it("Should list market items", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const marketItemId = 0;
    const price = ethers.utils.parseEther("1");
    const actor = 1;

    const marketItems = await nftMarketplace
      .connect(accounts[actor])
      .fetchMarketItems();
    expect(marketItems[marketItemId].collectionId).to.equal(collectionId);
    expect(marketItems[marketItemId].tokenId).to.equal(tokenId);
    expect(marketItems[marketItemId].seller).to.equal(accounts[actor].address);
    expect(marketItems[marketItemId].price).to.equal(price);
  });

  it("Should sell market item", async function () {
    const collectionId = 0;
    const tokenId = 0;
    const marketItemId = 0;
    const price = ethers.utils.parseEther("1");
    const actor = 2;

    const provider = waffle.provider;
    const marketItemBefore = await nftMarketplace.marketItems(marketItemId);
    const balanceSellerBefore = await provider.getBalance(
      marketItemBefore.seller
    );
    const balanceBuyerBefore = await provider.getBalance(
      accounts[actor].address
    );

    const sellMarketItem = await nftMarketplace
      .connect(accounts[actor])
      .sellMarketItem(marketItemId, { value: price });
    await sellMarketItem.wait();

    const marketItems = await nftMarketplace
      .connect(accounts[actor])
      .fetchMarketItems();
    expect(marketItems.length).to.equal(0);

    const collection = await nftMarketplace.collections(collectionId);
    const nftCollection = await NftCollection.attach(
      collection.contractAddress
    );
    expect(await nftCollection.ownerOf(tokenId)).to.equal(
      accounts[actor].address
    );

    const marketItemAfter = await nftMarketplace.marketItems(marketItemId);
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
