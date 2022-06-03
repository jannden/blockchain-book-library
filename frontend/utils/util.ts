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
  // Add your network rpc URL here
  1: "https://ethereumnode.defiterm.io",
  3: "https://ethereumnode.defiterm-dev.net",
};

// Network chain ids
export const supportedMetamaskNetworks = [1, 3, 4, 5, 42];

export const groupBy = (items, key) => {
  const groupedObject = items.reduce(
    (result, item) => ({
      ...result,
      [item[key]]: [...(result[item[key]] || []), item],
    }),
    {}
  );
  return groupedObject;
};

export const removeDuplicates = (arrayOfObjects, uniqueKey1, uniqueKey2) => {
  return arrayOfObjects.filter(
    (thing, index, self) =>
      self.findIndex(
        (t) => t[uniqueKey1] === thing[uniqueKey1] && t[uniqueKey2] === thing[uniqueKey2]
      ) === index
  );
};

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

// The Graph
export const graphUrl = "https://api.studio.thegraph.com/query/28136/nftmarketplace/v1.2";
export const graphQuery = `
      query {
      itemListeds {
        id
        seller
        nftAddress
        tokenId
        price
        timestamp
        owner
        tokenUri
      }
      itemCanceleds {
        id
        seller
        nftAddress
        tokenId
        timestamp
        owner
        tokenUri
      }
      itemBoughts {
        id
        buyer
        nftAddress
        tokenId
        price
        timestamp
        owner
        tokenUri
      }
      collectionAddeds {
        id
        deployer
        nftAddress
        timestamp
      }
    }
  `;
