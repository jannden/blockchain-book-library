import { useWeb3React } from "@web3-react/core";
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
        <button
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
        </button>
      ) : (
        <button onClick={startOnboarding}>Install Metamask</button>
      )}
      {
        <button
          disabled={connecting}
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
        </button>
      }
    </>
  );
};

export default LoggedOut;
