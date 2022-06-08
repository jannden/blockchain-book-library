export const getUserCollections = `
    query getUserCollections($account: Bytes) {
      collectionAddeds(where:{deployer: $account}) {
        id
        deployer
        nftAddress
        timestamp
      }
    }
  `;
