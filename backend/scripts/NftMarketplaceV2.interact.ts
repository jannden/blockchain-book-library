import * as dotenv from "dotenv";

import { Contract } from "ethers";
import hre, { ethers } from "hardhat";
import {
  createClient,
  debugExchange,
  cacheExchange,
  fetchExchange,
} from "@urql/core";

dotenv.config();

const contractName = "NftMarketplaceV2";
const sepoliaContractAddress = "0xb0C95A36B54d02Ea5714518Fa3371C42D33EC132";
const graphUrl =
  "https://api.studio.thegraph.com/query/28136/nft-marketplace-sepolia/version/latest";

async function interact() {
  // The wallets
  const [alicesWallet, bobsWallet] = await ethers.getSigners();
  console.log(
    "Alice's balance is",
    ethers.utils.formatEther(await alicesWallet.getBalance()),
  );
  console.log(
    "Bob's balance is",
    ethers.utils.formatEther(await bobsWallet.getBalance()),
  );

  // Contract
  let contract: Contract;
  if (hre.hardhatArguments.network === "sepolia") {
    const Contract = await ethers.getContractFactory(contractName);
    contract = await Contract.attach(sepoliaContractAddress);
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

  const urqlClient = createClient({
    url: graphUrl,
    exchanges: [debugExchange, cacheExchange, fetchExchange],
  });
  const data = await urqlClient.query(graphQuery, undefined).toPromise();
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
