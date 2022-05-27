import { useWeb3React } from "@web3-react/core";
import useENSName from "../hooks/useENSName";
import { formatEtherscanLink, shortenHex } from "../utils/util";
import NativeCurrencyBalance from "./NativeCurrencyBalance";

const LoggedIn = () => {
  const { error, deactivate, chainId, account, setError, library } = useWeb3React();

  const ENSName = useENSName(account);

  return (
    <>
      <a
        {...{
          href: formatEtherscanLink("Account", [chainId, account]),
          target: "_blank",
          rel: "noopener noreferrer",
        }}
      >
        {ENSName || `${shortenHex(account, 4)}`}
      </a>
      <br />
      {typeof account === "string" && !!library && <NativeCurrencyBalance />}
      <br />
      <button
        onClick={async () => {
          try {
            await deactivate();
          } catch (e) {
            setError(error);
          }
        }}
      >
        Disconnect
      </button>
    </>
  );
};

export default LoggedIn;
