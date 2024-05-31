import type { BigNumberish } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";
import { BaseContract, ethers } from "ethers";
import nftCollectionFactory from "../contracts/NftCollection.json";
import { NftCollection } from "../contracts/types";
import type { JsonRpcSigner } from "@ethersproject/providers";

export interface CollectionContract extends BaseContract {
  safeMint: (...args: any[]) => Promise<ethers.ContractTransaction>;
  // Define other methods here
}

export function shortenHex(hex: string, length = 4) {
  return `${hex.substring(0, length + 2)}…${hex.substring(hex.length - length)}`;
}

const ETHERSCAN_PREFIXES = {
  1: "",
  11155111: "sepolia.",
};

export function formatEtherscanLink(type: "Account" | "Transaction", data: [number, string]) {
  switch (type) {
    case "Account": {
      const [chainId, address] = data;
      return `https://${ETHERSCAN_PREFIXES[chainId]}etherscan.io/address/${address}`;
    }
    case "Transaction": {
      const [chainId, hash] = data;
      return `https://${ETHERSCAN_PREFIXES[chainId]}etherscan.io/tx/${hash}`;
    }
  }
}

export const parseBalance = (value: BigNumberish, decimals = 18, decimalsToDisplay = 3) =>
  parseFloat(formatUnits(value, decimals)).toFixed(decimalsToDisplay);

export interface Networks {
  [key: number]: string;
}

export const walletConnectSupportedNetworks: Networks = {
  1: "https://ethereumnode.defiterm.io",
  11155111: "https://ethereumnode.defiterm-dev.net",
};

export const supportedMetamaskNetworks = [1, 11155111];

export const ipfsPath = "https://ipfs.io/ipfs";

export const getCollectionContract = async (
  signer: JsonRpcSigner,
  contractAddress?: string,
  args?: any[]
): Promise<NftCollection> => {
  const Factory = new ethers.ContractFactory(
    nftCollectionFactory.abi,
    nftCollectionFactory.bytecode,
    signer
  );
  if (contractAddress) {
    const collectionContract = Factory.attach(contractAddress);
    return collectionContract as NftCollection;
  }
  console.log("Deploying new contract for collection");
  const collectionContract = await Factory.deploy(...(args || []));
  console.log("Deployed, waiting for confirmation");
  await collectionContract.deployed();
  console.log("Deployment confirmed and done!");
  return collectionContract as NftCollection;
};

export const doAccountsMatch = (account1: string, account2: string) => {
  return account1.toLowerCase() === account2.toLowerCase();
};

// The Graph
export const graphUrl =
  "https://api.studio.thegraph.com/query/28136/nft-marketplace-sepolia/version/latest";

export const graphQueryNew = `
    query getUserCollections($address: Bytes) {
      itemListeds(orderBy: timestamp, orderDirection: desc) {
        id
        seller
        nftAddress
        tokenId
        price
        timestamp
        tokenUri
      }
      itemCanceleds(orderBy: timestamp, orderDirection: desc) {
        id
        seller
        nftAddress
        tokenId
        timestamp
        tokenUri
      }
      itemBoughts(orderBy: timestamp, orderDirection: desc) {
        id
        buyer
        nftAddress
        tokenId
        price
        timestamp
        tokenUri
      }
      collectionAddeds(where: { deployer: $address }, orderBy: timestamp, orderDirection: desc) {
        id
        deployer
        nftAddress
        timestamp
      }
    }
  `;

export function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
