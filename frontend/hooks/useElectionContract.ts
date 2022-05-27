import electionFactory from "../contracts/Election.json";
import type { Election } from "../contracts/types/Election";
import useContract from "./useContract";

export default function useUSElectionContract(contractAddress?: string) {
  return useContract<Election>(contractAddress, electionFactory.abi);
}
