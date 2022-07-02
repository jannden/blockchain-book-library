import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const collectionParams = ["Crypto Zombies", "CZ"];
const ipfsPath = "ipfs_path";

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
  //   Marketplace   //
  /// //////////////////
  it("Should not set zero marketplace fee", async function () {
    await expect(nftMarketplaceContract.setListingFee(0)).to.be.revertedWith(
      "Fee should be above zero."
    );
  });

  it("Should set marketplace fee", async function () {
    const fee = ethers.utils.parseEther("0.5");

    const tx = await nftMarketplaceContract.setListingFee(fee);
    await tx.wait();

    expect(await nftMarketplaceContract.listingFee()).to.equal(fee);
  });

  /// //////////////////
  //   Collections   //
  /// //////////////////

  it("Should deploy a collection", async function () {
    const actor = 1;

    collectionContract = await NftCollection.connect(accounts[actor]).deploy(
      ...collectionParams,
      nftMarketplaceContract.address
    );
    await collectionContract.deployed();

    expect(await collectionContract.totalSupply()).to.equal(0);
  });

  it("Should not add collection by not owner", async function () {
    const actor = 2;

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .addCollection(collectionContract.address)
    ).to.be.revertedWith("Only collection owner can add it.");
  });

  it("Should add collection", async function () {
    const actor = 1;

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .addCollection(collectionContract.address)
    )
      .to.emit(nftMarketplaceContract, "CollectionAdded")
      .withArgs(accounts[actor].address, collectionContract.address);
  });

  it("Should not add collection twice", async function () {
    const actor = 1;

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .addCollection(collectionContract.address)
    ).to.be.revertedWith("Collection already exists.");
  });

  it("Should mint a new token", async function () {
    const actor = 1;

    const tx = await collectionContract
      .connect(accounts[actor])
      .safeMint(accounts[actor].address, ipfsPath);
    await tx.wait();

    expect(
      await collectionContract
        .connect(accounts[actor])
        .balanceOf(accounts[actor].address)
    ).to.equal(1);
  });

  it("Should support interface", async function () {
    const interfaceBytes = {
      ERC721: "0x80ac58cd",
      ERC721Metadata: "0x5b5e139f",
      ERC721Enumerable: "0x780e9d63",
    };
    expect(
      await collectionContract.supportsInterface(interfaceBytes.ERC721)
    ).to.equal(true);
    expect(
      await collectionContract.supportsInterface(interfaceBytes.ERC721Metadata)
    ).to.equal(true);
    expect(
      await collectionContract.supportsInterface(
        interfaceBytes.ERC721Enumerable
      )
    ).to.equal(true);
  });

  it("Should return tokenURI", async function () {
    const tokenId = 0;
    expect(await collectionContract.tokenURI(tokenId)).to.equal(ipfsPath);
  });

  it("Should burn a token and create a new one", async function () {
    const tokenId = 0;
    const actor = 1;
    await collectionContract.connect(accounts[actor]).burn(tokenId);
    expect(await collectionContract.totalSupply()).to.equal(0);

    const tx = await collectionContract
      .connect(accounts[actor])
      .safeMint(accounts[actor].address, ipfsPath);
    await tx.wait();
    expect(await collectionContract.totalSupply()).to.equal(1);
    expect(
      await collectionContract
        .connect(accounts[actor])
        .balanceOf(accounts[actor].address)
    ).to.equal(1);
  });

  it("Should mint a second token", async function () {
    const actor = 1;

    const tx = await collectionContract
      .connect(accounts[actor])
      .safeMint(accounts[actor].address, ipfsPath);
    await tx.wait();
    expect(await collectionContract.totalSupply()).to.equal(2);
    expect(
      await collectionContract
        .connect(accounts[actor])
        .balanceOf(accounts[actor].address)
    ).to.equal(2);
  });

  /// //////////////////
  //     Listing     //
  /// //////////////////

  it("Should not set non-approved token for sale", async function () {
    const tokenId = 1;
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

  it("Should not list not-approved token for sale", async function () {
    const tokenId = 1;
    const actor = 2;

    await expect(
      collectionContract
        .connect(accounts[actor])
        .approve(nftMarketplaceContract.address, tokenId)
    ).to.be.revertedWith(
      "ERC721: approve caller is not owner nor approved for all"
    );
  });

  it("Should approve token for sale", async function () {
    const tokenId = 1;
    const actor = 1;

    const tx = await collectionContract
      .connect(accounts[actor])
      .approve(nftMarketplaceContract.address, tokenId);
    await tx.wait();
  });

  it("Should not list not-owned token for sale", async function () {
    const tokenId = 1;
    const price = ethers.utils.parseEther("1");
    const actor = 2;

    const listingFee = await nftMarketplaceContract
      .connect(accounts[actor])
      .listingFee();

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .listItem(collectionContract.address, tokenId, price, {
          value: listingFee,
        })
    ).to.be.revertedWith("Should be owner of the token.");
  });

  it("Should not set zero-price token for sale", async function () {
    const tokenId = 1;
    const price = 0;
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
    ).to.be.revertedWith("Price not set.");
  });

  it("Should require marketplace fee for listing item", async function () {
    const tokenId = 1;
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
    const tokenId = 1;
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

  it("Should not set token for sale twice", async function () {
    const tokenId = 1;
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
    ).to.be.revertedWith("Shouldn't be listed.");
  });

  /// //////////////////
  //    Cancelling   //
  /// //////////////////

  it("Should not cancel if not owner", async function () {
    const tokenId = 1;
    const actor = 2;

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .cancelListing(collectionContract.address, tokenId)
    ).to.be.revertedWith("Caller isn't owner or nft contract.");
  });

  it("Should cancel listed item", async function () {
    const tokenId = 1;
    const actor = 1;

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .cancelListing(collectionContract.address, tokenId)
    )
      .to.emit(nftMarketplaceContract, "ItemCanceled")
      .withArgs(accounts[actor].address, collectionContract.address, tokenId);
  });

  it("Should not cancel not listed item", async function () {
    const tokenId = 1;
    const actor = 1;

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .cancelListing(collectionContract.address, tokenId)
    ).to.be.revertedWith("Should be listed.");
  });

  it("Should cancel listing if token is transferred outside of marketplace", async function () {
    const tokenId = 2;
    const price = ethers.utils.parseEther("1");
    const actor = 1;
    const actor2 = 1;

    // Listing the token
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

    // Transferring the token outside of the marketplace
    await expect(
      collectionContract
        .connect(accounts[actor])
        .transferFrom(
          accounts[actor].address,
          accounts[actor2].address,
          tokenId
        )
    )
      .to.emit(nftMarketplaceContract, "ItemCanceled")
      .withArgs(
        collectionContract.address,
        collectionContract.address,
        tokenId
      );
  });

  /// //////////////////
  //     Buying     //
  /// //////////////////

  it("Should not buy not listed item", async function () {
    const tokenId = 1;
    const price = ethers.utils.parseEther("1");
    const actor = 2;

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .buyItem(collectionContract.address, tokenId, { value: price })
    ).to.be.revertedWith("Should be listed.");
  });

  it("Should set token for sale again", async function () {
    const tokenId = 1;
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

  it("Should not sell for incorrect price", async function () {
    const tokenId = 1;
    const price = ethers.utils.parseEther("0.5");
    const actor = 2;

    await expect(
      nftMarketplaceContract
        .connect(accounts[actor])
        .buyItem(collectionContract.address, tokenId, { value: price })
    ).to.be.revertedWith("Price mismatch.");
  });

  it("Should sell market item", async function () {
    const tokenId = 1;
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

  xit("Should withdraw funds of seller", async function () {
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
