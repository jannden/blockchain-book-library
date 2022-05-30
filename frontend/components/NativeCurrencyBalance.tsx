import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import useNativeCurrencyBalance from "../hooks/useNativeCurrencyBalance";
import { parseBalance } from "../utils/util";

const NativeCurrencyBalance = () => {
  const { account } = useWeb3React<Web3Provider>();
  const { data } = useNativeCurrencyBalance(account);

  return <span>(Ξ{parseBalance(data ?? 0)})</span>;
};

export default NativeCurrencyBalance;
