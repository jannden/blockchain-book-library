import { useState, useMemo } from "react";
import { useQuery } from "urql";
import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { graphQueryNew, getCollectionContract } from "../utils/util";
import { useEffect } from "react";
import { doAccountsMatch } from "../utils/util";

// Custom hook to query TheGraph
export default function useGraph(address, listedOnly) {
  const { library, account } = useWeb3React<Web3Provider>();
  const [calculating, setCalculating] = useState(false);
  const [result, reexecuteQuery] = useQuery({
    query: graphQueryNew,
    variables: { address },
    context: useMemo(
      () => ({
        requestPolicy: "cache-and-network",
      }),
      []
    ),
  });
  const [collectionsList, setCollectionsList] = useState([]);
  const [dataLength, setDataLength] = useState(0);

  useEffect(() => {
    setCollectionsList([]);
  }, [address, account]);

  useEffect(() => {
    if (result.fetching) return;

    // Set up to refetch in x seconds, if the query is idle
    const timerId = setTimeout(() => {
      reexecuteQuery({ requestPolicy: "network-only" });
    }, 10 * 1000);

    return () => clearTimeout(timerId);
  }, [result.fetching, reexecuteQuery]);

  useEffect(() => {
    if (result.fetching || result.error) return;

    async function processData() {
      setCalculating(true);

      // Prepare signer
      const signer = library.getSigner(account);

      // Extract data
      const { itemListeds, itemBoughts, itemCanceleds, collectionAddeds } = result.data;

      // Set type property for each token-related event & add price zero to itemCanceleds
      const enhancedItemListeds = itemListeds.map((item) => ({
        nftAddress: item.nftAddress,
        tokenId: item.tokenId,
        tokenUri: item.tokenUri,
        price: item.price,
        type: "listed",
        timestamp: item.timestamp,
      }));
      const enhancedItemBoughts = itemBoughts.map((item) => ({
        nftAddress: item.nftAddress,
        tokenId: item.tokenId,
        tokenUri: item.tokenUri,
        price: "0", // item.price,
        type: "bought",
        timestamp: item.timestamp,
      }));
      const enhancedItemCanceleds = itemCanceleds.map((item) => ({
        nftAddress: item.nftAddress,
        tokenId: item.tokenId,
        tokenUri: item.tokenUri,
        price: "0",
        type: "canceled",
        timestamp: item.timestamp,
      }));

      // Merge token-related events and sort by timestamp desc
      const sortedAllEvents = [
        ...enhancedItemListeds,
        ...enhancedItemBoughts,
        ...enhancedItemCanceleds,
      ].sort((x, y) => y.timestamp - x.timestamp);

      // Remove duplicate tokens from the events, which will leave the most recent event type for each token
      const uniqueListedItems = removeDuplicateTokens(sortedAllEvents);

      // Enhance the listed items with owner property
      for (const [index, token] of uniqueListedItems.entries()) {
        const collectionContract = await getCollectionContract(signer, token.nftAddress, null);
        const owner = await collectionContract.ownerOf(token.tokenId);
        uniqueListedItems[index].owner = owner;
      }

      // Update the tokens list
      const relevantItems = [...uniqueListedItems];

      if (listedOnly === false) {
        // Add collections deployed by user
        const userDeployedCollections = collectionAddeds.filter((token) =>
          doAccountsMatch(token.deployer, address)
        );

        // Add tokens of the logged-in user, that have never been listed
        for (const collection of userDeployedCollections) {
          const collectionContract = await getCollectionContract(
            signer,
            collection.nftAddress,
            null
          );
          const bigNumberTokenCount = await collectionContract.balanceOf(address);
          const tokenCount = Number(bigNumberTokenCount.toString());
          if (tokenCount === 0) {
            relevantItems.push({
              nftAddress: collection.nftAddress,
              tokenId: undefined,
              tokenUri: undefined,
              type: undefined,
              price: undefined,
              owner: undefined,
            });
            continue;
          }
          for (let i = 0; i < tokenCount; i++) {
            const tokenId = (await collectionContract.tokenOfOwnerByIndex(address, i)).toNumber();
            if (
              relevantItems.some(
                (token) => token.nftAddress == collection.nftAddress && token.tokenId == tokenId
              )
            ) {
              continue;
            }
            const tokenUri = await collectionContract.tokenURI(tokenId);
            relevantItems.push({
              nftAddress: collection.nftAddress,
              tokenId,
              tokenUri,
              type: "minted",
              price: "0",
              owner: address,
            });
          }
        }
      }
      const grouped = await groupBy(relevantItems, "nftAddress", signer, address);
      setCollectionsList(grouped);

      setCalculating(false);
    }

    if (!result?.error && result.data && account && library?._isProvider) {
      // Get data length
      const { itemListeds, itemBoughts, itemCanceleds, collectionAddeds } = result.data;
      setDataLength(
        itemListeds.length + itemBoughts.length + itemCanceleds.length + collectionAddeds.length
      );
      // Process data
      processData();
    }

    if (result?.error) {
    }
  }, [result, account, address, library, listedOnly]);

  return {
    collectionsList,
    dataLength,
    fetching: result.fetching,
    calculating: calculating,
    error: result.error,
  };
}

async function groupBy(items, key, signer, address) {
  const groupedObject = items.reduce(
    (result, item) => ({
      ...result,
      [item[key]]: [...(result[item[key]] || []), item],
    }),
    {}
  );
  const groupedArray = [];
  for (const nftAddress in groupedObject) {
    const collectionContract = await getCollectionContract(signer, nftAddress, null);
    const collectionName = await collectionContract.name();
    const collectionOwner = await collectionContract.owner();
    groupedArray.push({
      nftAddress,
      tokens: groupedObject[nftAddress],
      collectionName,
      isCollectionOwner: doAccountsMatch(collectionOwner, address),
    });
  }
  return groupedArray;
}

const removeDuplicateTokens = (arrayOfObjects) => {
  return arrayOfObjects.filter(
    (item1, index, self) =>
      self.findIndex(
        (item2) => item1.nftAddress === item2.nftAddress && item1.tokenId === item2.tokenId
      ) === index
  );
};
