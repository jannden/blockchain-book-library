import type { BigNumberish } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";
import type { JsonRpcSigner } from "@ethersproject/providers";
import { ethers } from "ethers";
import nftCollectionFactory from "../contracts/NftCollection.json";
import { create as createIpsf, IPFSHTTPClient } from "ipfs-http-client";

export function shortenHex(hex: string, length = 4) {
  return `${hex.substring(0, length + 2)}…${hex.substring(hex.length - length)}`;
}

const ETHERSCAN_PREFIXES = {
  1: "",
  3: "ropsten.",
  4: "rinkeby.",
  5: "goerli.",
  42: "kovan.",
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
  3: "https://ethereumnode.defiterm-dev.net",
};

export const supportedMetamaskNetworks = [1, 3, 4, 5, 42];

export const ipfs: IPFSHTTPClient = createIpsf({
  url: "https://ipfs.infura.io:5001",
});
export const ipfsPath = "https://ipfs.infura.io/ipfs";

export const getCollectionContract = async (
  signer: JsonRpcSigner,
  contractAddress?: string,
  args?: any[]
): Promise<ethers.Contract> => {
  const Factory = new ethers.ContractFactory(
    nftCollectionFactory.abi,
    nftCollectionFactory.bytecode,
    signer
  );
  if (contractAddress) {
    const collectionContract = Factory.attach(contractAddress);
    return collectionContract;
  }
  const collectionContract = await Factory.deploy(...(args || []));
  await collectionContract.deployed();
  return collectionContract;
};

export const doAccountsMatch = (account1: string, account2: string) => {
  return account1.toLowerCase() === account2.toLowerCase();
};

// The Graph
export const graphUrl = "https://api.studio.thegraph.com/query/28136/nftmarketplace/v1.3";
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
