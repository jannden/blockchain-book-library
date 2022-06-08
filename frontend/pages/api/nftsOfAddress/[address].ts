import { ethers } from "ethers";
import { createClient } from "urql";
import {
  graphUrl,
  graphQuery,
  getCollectionContract,
  removeDuplicateTokens,
  groupBy,
} from "../../../utils/util";

export default async function handler({ query: { address } }, res) {
  const account = address;

  // Create connection to the Graph
  const client = createClient({ url: graphUrl });

  // Extract data
  const data = await client.query(graphQuery).toPromise();
  const { itemListeds, itemCanceleds, itemBoughts, collectionAddeds } = data.data;

  // Get items currently listed in the marketplace for purchase
  const mergedFilter = [...itemCanceleds, ...itemBoughts];
  const currentlyListedItems = removeDuplicateTokens(
    itemListeds.filter((el: any) => {
      return !mergedFilter.some((f) => {
        return (
          f.nftAddress === el.nftAddress && f.tokenId === el.tokenId && f.timestamp > el.timestamp
        );
      });
    })
  );

  /*
   * Get items owned by the user grouped by NFT collections
   * (Minted + Bought / Listed + Not Listed)
   * Not listed minted tokens can be accessed by iterating over all user collections calling
   * balanceOf() and then tokenOfOwnerByIndex(). Any tokens that are owned by the user and
   * have ever been listed on the marketplace can be omitted, as they will be fetched from
   * the marketplace events.
   */
  const mergedMarketplace = [...itemListeds, ...itemCanceleds, ...itemBoughts].sort(
    ({ timestamp: a }, { timestamp: b }) => b - a
  );
  const mergedMarketplaceWithoutDuplicates = removeDuplicateTokens(mergedMarketplace);
  const ownedByUserEverListed = mergedMarketplaceWithoutDuplicates
    .filter((token) => token.owner == account.toLowerCase())
    .map((token) => ({
      nftAddress: token.nftAddress,
      tokenId: token.tokenId,
      tokenUri: token.tokenUri,
    }));
  const userItems = [...ownedByUserEverListed];

  const userMintableCollections = collectionAddeds.filter(
    (token) => token.deployer == account.toLowerCase()
  );
  for (const collection of userMintableCollections) {
    const jsonRpcProvider = new ethers.providers.JsonRpcProvider(process.env.INFURA);
    const signer = jsonRpcProvider.getSigner(account);
    const collectionContract = await getCollectionContract(signer, collection.nftAddress, null);
    const tokenCount = await collectionContract.balanceOf(account);
    for (let i = 0; i < tokenCount; i++) {
      const tokenId = (await collectionContract.tokenOfOwnerByIndex(account, i)).toNumber();
      if (
        mergedMarketplace.some(
          (token) => token.nftAddress == collection.nftAddress && token.tokenId == tokenId
        )
      ) {
        continue;
      }
      const tokenUri = await collectionContract.tokenURI(tokenId);
      userItems.push({ nftAddress: collection.nftAddress, tokenId, tokenUri });
    }
  }

  // Check which user items are currently listed
  const enhancedUserItems = userItems.map((item) => {
    const currentlyListed = currentlyListedItems.some((f) => {
      return f.nftAddress === item.nftAddress && f.tokenId === item.tokenId;
    });
    return { ...item, currentlyListed };
  });

  // Add collections that the user hasn't deployed but owns tokens from
  const mixOfCollections = [...userMintableCollections, ...enhancedUserItems].map(
    (item) => item.nftAddress
  );
  const userAllCollections = mixOfCollections
    .filter((item, pos) => mixOfCollections.indexOf(item) == pos)
    .map((item) => ({ nftAddress: item }));

  res.status(200).json({
    allListedItems: groupBy(currentlyListedItems, "nftAddress"),
    listedItemsByOthers: groupBy(
      currentlyListedItems.filter((el: any) => el.owner != account.toLowerCase()),
      "nftAddress"
    ),
    userItems: groupBy(enhancedUserItems, "nftAddress"),
    userMintableCollections,
    userAllCollections,
  });
}
