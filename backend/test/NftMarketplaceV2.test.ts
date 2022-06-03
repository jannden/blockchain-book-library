import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const collectionParams = ["Crypto Zombies", "CZ"];

const setGlobals = async () => {
  const accounts = await ethers.getSigners();

  const NftMarketplaceV2 = await ethers.getContractFactory("NftMarketplaceV2");
  const nftMarketplaceContract = await NftMarketplaceV2.deploy();
  await nftMarketplaceContract.deployed();

  const NftCollection = await ethers.getContractFactory("NftCollection");

  return { nftMarketplaceContract, NftCollection, accounts };
};

describe("NftMarketplaceV2", function () {
  let nftMarketplaceContract: Contract;
  let NftCollection: ContractFactory;
  let collectionContract: Contract;
  let accounts: Array<SignerWithAddress>;

  before(async function () {
    const globals = await setGlobals();
    nftMarketplaceContract = globals.nftMarketplaceContract;
    NftCollection = globals.NftCollection;
    accounts = globals.accounts;
  });

  /// //////////////////
  //    Deploying    //
  /// //////////////////

  it("Should deploy a collection", async function () {
    const actor = 1;

    collectionContract = await NftCollection.connect(accounts[actor]).deploy(
      ...collectionParams,
      nftMarketplaceContract.address
    );
    await collectionContract.deployed();

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .addCollection(collectionContract.address)
    )
      .to.emit(nftMarketplaceContract, "CollectionAdded")
      .withArgs(accounts[actor].address, collectionContract.address);
  });

  it("Should mint a new token", async function () {
    const imagePath = "ipfs_path";
    const actor = 1;

    const tx = await collectionContract
      .connect(accounts[actor])
      .safeMint(accounts[actor].address, imagePath);
    await tx.wait();

    expect(
      await collectionContract
        .connect(accounts[actor])
        .balanceOf(accounts[actor].address)
    ).to.equal(1);
  });

  /// //////////////////
  //     Listing     //
  /// //////////////////

  it("Should not set non-approved token for sale", async function () {
    const tokenId = 0;
    const price = ethers.utils.parseEther("1");
    const actor = 1;

    const listingFee = await nftMarketplaceContract
      .connect(accounts[actor])
      .listingFee();

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .listItem(collectionContract.address, tokenId, price, {
          value: listingFee,
        })
    ).to.be.revertedWith("Approve marketplace first.");
  });

  it("Should not list not-owned token for sale", async function () {
    const tokenId = 0;
    const actor = 2;

    await expect(
      collectionContract
        .connect(accounts[actor])
        .approve(nftMarketplaceContract.address, tokenId)
    ).to.be.revertedWith(
      "ERC721: approve caller is not owner nor approved for all"
    );
  });

  it("Should not set zero-price token for sale", async function () {
    const tokenId = 0;
    const price = 0;
    const actor = 1;

    const tx = await collectionContract
      .connect(accounts[actor])
      .approve(nftMarketplaceContract.address, tokenId);
    await tx.wait();

    const listingFee = await nftMarketplaceContract
      .connect(accounts[actor])
      .listingFee();

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .listItem(collectionContract.address, tokenId, price, {
          value: listingFee,
        })
    ).to.be.revertedWith("Price not set.");
  });

  it("Should require marketplace fee for listing item", async function () {
    const tokenId = 0;
    const price = ethers.utils.parseEther("1");
    const actor = 1;

    const tx = await collectionContract
      .connect(accounts[actor])
      .approve(nftMarketplaceContract.address, tokenId);
    await tx.wait();

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .listItem(collectionContract.address, tokenId, price, {
          value: 0,
        })
    ).to.be.revertedWith("Listing fee not met.");
  });

  it("Should set token for sale", async function () {
    const tokenId = 0;
    const price = ethers.utils.parseEther("1");
    const actor = 1;

    const tx = await collectionContract
      .connect(accounts[actor])
      .approve(nftMarketplaceContract.address, tokenId);
    await tx.wait();

    const listingFee = await nftMarketplaceContract
      .connect(accounts[actor])
      .listingFee();

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .listItem(collectionContract.address, tokenId, price, {
          value: listingFee,
        })
    )
      .to.emit(nftMarketplaceContract, "ItemListed")
      .withArgs(
        accounts[actor].address,
        collectionContract.address,
        tokenId,
        price
      );
  });

  it("Should cancel listed item", async function () {
    const tokenId = 0;
    const actor = 1;

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .cancelListing(collectionContract.address, tokenId)
    )
      .to.emit(nftMarketplaceContract, "ItemCanceled")
      .withArgs(accounts[actor].address, collectionContract.address, tokenId);
  });

  /// //////////////////
  //     Buying     //
  /// //////////////////

  it("Should set token for sale again", async function () {
    const tokenId = 0;
    const price = ethers.utils.parseEther("1");
    const actor = 1;

    const tx = await collectionContract
      .connect(accounts[actor])
      .approve(nftMarketplaceContract.address, tokenId);
    await tx.wait();

    const listingFee = await nftMarketplaceContract
      .connect(accounts[actor])
      .listingFee();

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .listItem(collectionContract.address, tokenId, price, {
          value: listingFee,
        })
    )
      .to.emit(nftMarketplaceContract, "ItemListed")
      .withArgs(
        accounts[actor].address,
        collectionContract.address,
        tokenId,
        price
      );
  });

  it("Should sell market item", async function () {
    const tokenId = 0;
    const price = ethers.utils.parseEther("1");
    const actor = 2;

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .buyItem(collectionContract.address, tokenId, { value: price })
    )
      .to.emit(nftMarketplaceContract, "ItemBought")
      .withArgs(
        accounts[actor].address,
        collectionContract.address,
        tokenId,
        price
      );
  });

  it("Should withdraw funds of seller", async function () {
    const actor = 1;

    const provider = waffle.provider;
    const balanceBefore = await provider.getBalance(accounts[actor].address);

    const tx = await nftMarketplaceContract
      .connect(accounts[actor])
      .withdrawFunds();
    await tx.wait();

    const balanceAfter = await provider.getBalance(accounts[actor].address);

    expect(Number(ethers.utils.formatEther(balanceBefore))).to.be.lessThan(
      Number(ethers.utils.formatEther(balanceAfter))
    );
  });

  xit("Should withdraw funds of marketplace owner", async function () {
    const actor = 0;

    const provider = waffle.provider;
    const balanceBefore = await provider.getBalance(accounts[actor].address);

    const tx = await nftMarketplaceContract
      .connect(accounts[actor])
      .withdrawFunds();
    await tx.wait();

    const balanceAfter = await provider.getBalance(accounts[actor].address);

    expect(Number(ethers.utils.formatEther(balanceBefore))).to.be.lessThan(
      Number(ethers.utils.formatEther(balanceAfter))
    );
  });
});
