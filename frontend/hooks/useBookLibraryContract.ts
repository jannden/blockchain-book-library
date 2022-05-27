import bookLibraryFactory from "../contracts/BookLibraryV2.json";
import type { BookLibraryV2 } from "../contracts/types/BookLibraryV2";
import useContract from "./useContract";

export default function useUSElectionContract(contractAddress?: string) {
  return useContract<BookLibraryV2>(contractAddress, bookLibraryFactory.abi);
}
