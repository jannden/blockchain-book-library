import BOOKLIBRARY_ABI from "../contracts/BookLibrary.json";
import type { BookLibrary } from "../contracts/types/BookLibrary";
import useContract from "./useContract";

export default function useUSElectionContract(contractAddress?: string) {
  return useContract<BookLibrary>(contractAddress, BOOKLIBRARY_ABI);
}
