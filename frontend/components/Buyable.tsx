import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { useState, cloneElement } from "react";
import { deployedNftMarketplace } from "../utils/deployedContracts";
import useNftMarketplaceContract from "../hooks/useNftMarketplaceContract";
import { formatEtherscanLink, shortenHex } from "../utils/util";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import { InfoType } from "../utils/types";
import useGraph from "../hooks/useGraph";

const Buyable = ({ children, listedOnly, graphAccount }) => {
  const { chainId } = useWeb3React<Web3Provider>();
  const nftMarketplaceContract = useNftMarketplaceContract(deployedNftMarketplace.address);
  const graphData = useGraph(graphAccount, listedOnly);

  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [info, setInfo] = useState<InfoType>({});

  /////////////////////
  //     Buy Item    //
  /////////////////////

  const handlePurchase = async (nftAddress, tokenId, price) => {
    // Checking user input
    if (!nftAddress || !tokenId || !price) {
      setInfo({ error: "Fill out the fields." });
      return;
    }
    setInfo({});
    setTransactionInProgress(true);

    try {
      const tx = await nftMarketplaceContract.buyItem(nftAddress, tokenId, { value: price });
      setInfo({
        info: "Transaction pending...",
        link: formatEtherscanLink("Transaction", [tx.chainId || chainId, tx.hash]),
        hash: shortenHex(tx.hash),
      });
      await tx.wait();
      setInfo((prevInfo) => ({ ...prevInfo, info: "Transaction completed." }));
    } catch (error) {
      setInfo({ error: error.error?.message || error.errorArgs?.[0] || error.message });
    } finally {
      setTransactionInProgress(false);
    }
  };

  return (
    <>
      {info.info && !transactionInProgress && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {info.info}{" "}
          {info.link && info.hash && (
            <Link href={info.link} rel="noopener noreferrer" target="_blank">
              {shortenHex(info.hash, 4)}
            </Link>
          )}
        </Alert>
      )}
      {info.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {info.error}
        </Alert>
      )}
      {graphData.error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {graphData.error.message}
        </Alert>
      ) : !graphData.dataLength ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No data yet.
        </Alert>
      ) : !graphData.collectionsList?.length && !graphData.error ? (
        <CircularProgress color="inherit" sx={{ mb: 3 }} />
      ) : (
        cloneElement(children, {
          transactionInProgress,
          handlePurchase,
          graphData,
        })
      )}
      <Backdrop
        sx={{ color: "#fff", flexDirection: "column", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={transactionInProgress}
      >
        <CircularProgress color="inherit" sx={{ mb: 3 }} />
        {info.info && (
          <Alert severity="info">
            {info.info}{" "}
            {info.link && info.hash && (
              <Link href={info.link} rel="noopener noreferrer" target="_blank">
                {shortenHex(info.hash)}
              </Link>
            )}
          </Alert>
        )}
      </Backdrop>
    </>
  );
};

export default Buyable;
