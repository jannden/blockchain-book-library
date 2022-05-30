import { useWeb3React } from "@web3-react/core";
import Button from "@mui/material/Button";
import { UserRejectedRequestError } from "@web3-react/injected-connector";
import { useEffect, useState } from "react";
import { injected, walletConnect } from "../utils/connectors";
import useMetaMaskOnboarding from "../hooks/useMetaMaskOnboarding";

const LoggedOut = () => {
  const { active, error, activate, setError } = useWeb3React();

  const { isMetaMaskInstalled, isWeb3Available, startOnboarding, stopOnboarding } =
    useMetaMaskOnboarding();

  // manage connecting state for injected connector
  const [connecting, setConnecting] = useState(false);
  useEffect(() => {
    if (active || error) {
      setConnecting(false);
      stopOnboarding();
    }
  }, [active, error, stopOnboarding]);

  return (
    <>
      {isWeb3Available ? (
        <Button
          variant="contained"
          color="warning"
          disabled={connecting}
          onClick={() => {
            setConnecting(true);
            activate(injected, undefined, true).catch((error) => {
              // ignore the error if it's a user rejected request
              if (error instanceof UserRejectedRequestError) {
                setConnecting(false);
              } else {
                setError(error);
              }
            });
          }}
        >
          {isMetaMaskInstalled ? "Connect to MetaMask" : "Connect to Wallet"}
        </Button>
      ) : (
        <Button variant="contained" color="warning" onClick={startOnboarding}>
          Install Metamask
        </Button>
      )}
      {
        <Button
          variant="contained"
          color="warning"
          disabled={connecting}
          sx={{ marginLeft: 2 }}
          onClick={async () => {
            try {
              await activate(walletConnect(), undefined, true);
            } catch (e) {
              if (error instanceof UserRejectedRequestError) {
                setConnecting(false);
              } else {
                setError(error);
              }
            }
          }}
        >
          Wallet Connect
        </Button>
      }
    </>
  );
};

export default LoggedOut;
