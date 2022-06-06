export type InfoType = {
  error?: string;
  info?: string;
  link?: string;
  hash?: string;
};

export type Inputs = {
  nftName: string;
  nftSymbol: string;
  nftAddress: string;
  tokenId: string;
  price: string;
  tokenName: string;
  tokenImage: string;
};

export const defaultInputs: Inputs = {
  nftName: "",
  nftSymbol: "",
  nftAddress: "",
  tokenId: "",
  price: "",
  tokenName: "",
  tokenImage: "",
};

export type EventData = {
  nftAddress: string;
  tokenId: number;
};

export type MarketplaceData = {
  allListedItems: Array<EventData>;
  listedItemsByOthers: Array<EventData>;
  userItems: Array<EventData>;
  userMintableCollections: Array<EventData>;
  userAllCollections: Array<EventData>;
  setRefreshGraph: Array<EventData>;
};

export const defaultMarketplaceData: MarketplaceData = {
  allListedItems: [],
  listedItemsByOthers: [],
  userItems: [],
  userMintableCollections: [],
  userAllCollections: [],
  setRefreshGraph: [],
};

export type Dialogs = {
  deployCollection: boolean;
  mintToken: boolean;
  listItem: boolean;
  cancelListing: boolean;
};

export const defaultDialogs: Dialogs = {
  deployCollection: false,
  mintToken: false,
  listItem: false,
  cancelListing: false,
};

export enum DialogActionTypes {
  DEPLOY_COLLECTION,
  MINT_TOKEN,
  LIST_ITEM,
  CANCEL_LISTING,
}

export type DialogToken = {
  nftAddress: string;
  tokenId: string;
};

export const defaultDialogToken: DialogToken = {
  nftAddress: "",
  tokenId: "",
};
