import type { ExternalProvider, JsonRpcFetchFunc, Networkish } from "@ethersproject/providers";
import { Web3Provider } from "@ethersproject/providers";

export default function getLibrary(
  provider: ExternalProvider | JsonRpcFetchFunc
) {
  return new Web3Provider(provider);
}
