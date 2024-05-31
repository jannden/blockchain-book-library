import type { ExternalProvider, JsonRpcFetchFunc, Networkish } from "@ethersproject/providers";
import { Web3Provider } from "@ethersproject/providers";

export default function getLibrary(
  provider: ExternalProvider | JsonRpcFetchFunc
) {
  // Sepolia:
  const network: Networkish = 11155111;
  return new Web3Provider(provider, network);
}
