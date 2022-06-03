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

export type ActiveToken = {
  nftAddress: string;
  tokenId: string;
};

export const defaultActiveToken: ActiveToken = {
  nftAddress: "",
  tokenId: "",
};

export enum DialogActionTypes {
  LIST,
  CANCEL,
}
