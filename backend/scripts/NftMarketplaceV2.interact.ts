import * as dotenv from "dotenv";

import { Contract } from "ethers";
import hre, { ethers } from "hardhat";
import { createClient } from "urql";

dotenv.config();

const contractName = "NftMarketplaceV2";
const rinkebyContractAddress = "0xd5fD20ee4Adc3c0A13f68800266c0b0687EBA0a0";
const graphUrl =
  "https://api.studio.thegraph.com/query/28136/nftmarketplace/0.0.4";

async function interact() {
  // The wallets
  const [alicesWallet, bobsWallet] = await ethers.getSigners();
  console.log(
    "Alice's balance is",
    ethers.utils.formatEther(await alicesWallet.getBalance())
  );
  console.log(
    "Bob's balance is",
    ethers.utils.formatEther(await bobsWallet.getBalance())
  );

  // Contract
  let contract: Contract;
  if (hre.hardhatArguments.network === "rinkeby") {
    const Contract = await ethers.getContractFactory(contractName);
    contract = await Contract.attach(rinkebyContractAddress);
  } else {
    // Redeploy to clean state
    const Contract = await ethers.getContractFactory(contractName);
    contract = await Contract.deploy();
  }
  console.log("Contract address is", contract.address);

  const graphQuery = `
      query {
      itemListeds {
        id
        seller
        nftAddress
        tokenId
        price
        timestamp
        owner
        nftUri
      }
      itemCanceleds {
        id
        seller
        nftAddress
        tokenId
        timestamp
        owner
        nftUri
      }
      itemBoughts {
        id
        buyer
        nftAddress
        tokenId
        price
        timestamp
        owner
        nftUri
      }
    }
  `;

  const client = createClient({ url: graphUrl });
  const data = await client.query(graphQuery).toPromise();
  const { itemListeds, itemCanceleds, itemBoughts } = data.data;
  const mergedFilter = [...itemCanceleds, ...itemBoughts];
  const currentItems = itemListeds.filter((el: any) => {
    return !mergedFilter.some((f) => {
      return (
        f.nftAddress === el.nftAddress &&
        f.tokenId === el.tokenId &&
        f.timestamp > el.timestamp
      );
    });
  });
  console.log(currentItems);
}

interact().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = interact;
