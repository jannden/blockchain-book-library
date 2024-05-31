import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import useKeepSWRDataLiveAsBlocksArrive from "./useKeepSWRDataLiveAsBlocksArrive";

export default function useNativeCurrencyBalance(address: string) {
  const { library, chainId } = useWeb3React<Web3Provider>();

  const shouldFetch = typeof address === "string" && !!library?.ready;
  console.log("Balance check", shouldFetch, address, library?.ready);

  const result = useSWR(
    shouldFetch ? ["NativeCurrencyBalance", address, chainId] : null,
    async ([_tag, address, _chainId]) => {
      console.log("Fetching balance for ", _tag, address, _chainId);
      if (!address) return 0;
      return await library.getBalance(address);
    }
  );

  useKeepSWRDataLiveAsBlocksArrive(result.mutate);

  return result;
}
