import nftMarketplaceFactory from "../contracts/NftMarketplaceV2.json";
import type { NftMarketplaceV2 } from "../contracts/types/NftMarketplaceV2";
import useContract from "./useContract";

export default function useNftMarketplaceContract(contractAddress?: string) {
  return useContract<NftMarketplaceV2>(contractAddress, nftMarketplaceFactory.abi);
}
