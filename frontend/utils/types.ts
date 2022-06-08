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

export type TokensListData = {
  nftAddress: string;
  tokenId: string;
  tokenUri: string;
  price: string;
  type: string;
  owner: string;
};

export type MediaCardProps = {
  tokenData: TokensListData;
  handlePurchase?: (nftAddress: string, tokenId: string, price: string) => Promise<void>;
  handleDialogOpening?: (action: DialogActionTypes, nftAddress: string, tokenId: string) => void;
  transactionInProgress?: boolean;
};

export type TokenMetadata = {
  tokenName: string;
  tokenImage: string;
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
