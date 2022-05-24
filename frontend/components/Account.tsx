import { useWeb3React } from "@web3-react/core";
import { UserRejectedRequestError } from "@web3-react/injected-connector";
import Link from "next/link";
import { useEffect, useState } from "react";
import { injected, walletConnect } from "../connectors";
import useENSName from "../hooks/useENSName";
import useMetaMaskOnboarding from "../hooks/useMetaMaskOnboarding";
import { formatEtherscanLink, shortenHex } from "../util";
import NativeCurrencyBalance from "./NativeCurrencyBalance";

type AccountProps = {
  triedToEagerConnect: boolean;
};

const Account = ({ triedToEagerConnect }: AccountProps) => {
  const { active, error, activate, deactivate, chainId, account, setError, library } =
    useWeb3React();

  const {
    isMetaMaskInstalled,
    isWeb3Available,
    startOnboarding,
    stopOnboarding,
  } = useMetaMaskOnboarding();

  // manage connecting state for injected connector
  const [connecting, setConnecting] = useState(false);
  useEffect(() => {
    if (active || error) {
      setConnecting(false);
      stopOnboarding();
    }
  }, [active, error, stopOnboarding]);

  const ENSName = useENSName(account);

  if (error) {
    return null;
  }

  if (!triedToEagerConnect) {
    return null;
  }

  if (typeof account !== "string") {
    return (
    <>
      <nav>
        <div>
          <Link href="/">
            <a>LimeAcademy-boilerplate</a>
          </Link>
        </div>
        <div>
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
          {(<button
              disabled={connecting}
              onClick={async () => {
                try {
                  await activate(walletConnect(), undefined, true)
                } catch (e) {
                  if (error instanceof UserRejectedRequestError) {
                    setConnecting(false);
                  } else {
                    setError(error);
                  }
                }
              }}>
              Wallet Connect
            </button>)
          }
        </div>
      </nav>
      <style jsx>{`
        nav {
          display: flex;
          justify-content: space-between;
        }
        nav div {
          width: 150px;
          text-align: center;
        }
      `}</style>
    </>
    );
  }

  return (
  <>
    <nav>
      <div>
        <Link href="/">
          <a>LimeAcademy-boilerplate</a>
        </Link>
      </div>
      <div>
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
      </div>
      <div>
        <button
          onClick={async () => {
            try {
              await deactivate()
            } catch (e) { 
              setError(error);
            }
          }}>
          Disconnect
        </button>
      </div>
    </nav>
  
    <style jsx>{`
      nav {
        display: flex;
        justify-content: space-between;
      }
      nav div {
        width: 150px;
        text-align: center;
      }
    `}</style>
  </>
  );
};

export default Account;