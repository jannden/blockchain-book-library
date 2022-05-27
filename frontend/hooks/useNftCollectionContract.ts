import nftCollectionFactory from "../contracts/NftCollection.json";
import type { NftCollection } from "../contracts/types/NftCollection";
import useContract from "./useContract";

export default function useNftCollectionContract(contractAddress?: string) {
  return useContract<NftCollection>(contractAddress, nftCollectionFactory.abi);
}
