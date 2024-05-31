import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import useKeepSWRDataLiveAsBlocksArrive from "./useKeepSWRDataLiveAsBlocksArrive";

export default function useNativeCurrencyBalance(address: string) {
  const { library, chainId } = useWeb3React<Web3Provider>(); // TODO CHAINID 1 ???
  const shouldFetch = typeof address === "string" && !!library;

  const result = useSWR(
    shouldFetch ? ["NativeCurrencyBalance", address, chainId] : null,
    async ([_tag, address, _chainId]) => {
      console.log("Fetching balance for ", _tag, address, _chainId);
      if (!address) return 0;
      let balance;
      try {
        balance = await library.getBalance(address);
        console.log("Balance fetched ", balance);
      } catch (e) {
        console.error("Failed to fetch balance", e);
        return 0;
      }

      return balance;
    }
  );

  useKeepSWRDataLiveAsBlocksArrive(result.mutate);

  return result;
}
