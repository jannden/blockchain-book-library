import { useWeb3React } from "@web3-react/core";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import useENSName from "../hooks/useENSName";
import { formatEtherscanLink, shortenHex } from "../utils/util";
import NativeCurrencyBalance from "./NativeCurrencyBalance";

const LoggedIn = () => {
  const { error, deactivate, chainId, account, setError, library } = useWeb3React();

  const ENSName = useENSName(account);

  return (
    <>
      <Link
        color="white"
        underline="hover"
        {...{
          href: formatEtherscanLink("Account", [chainId, account]),
          target: "_blank",
          rel: "noopener noreferrer",
        }}
      >
        {ENSName || `${shortenHex(account, 4)}`}
        {typeof account === "string" && !!library && <NativeCurrencyBalance />}
      </Link>
      <Button
        variant="contained"
        color="info"
        sx={{ marginLeft: 2 }}
        onClick={async () => {
          try {
            await deactivate();
          } catch (e) {
            setError(error);
          }
        }}
      >
        Disconnect
      </Button>
    </>
  );
};

export default LoggedIn;
