import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import Grid from "@mui/material/Grid";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { useEffect, useState } from "react";
import { deployedNftMarketplace } from "../utils/deployedContracts";
import useNftMarketplaceContract from "../hooks/useNftMarketplaceContract";
import { formatEtherscanLink, shortenHex } from "../utils/util";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import MediaCard from "../components/MediaCard";
import { InfoType, MarketplaceData, defaultMarketplaceData } from "../utils/types";

const Marketplace = () => {
  const nftMarketplaceContract = useNftMarketplaceContract(deployedNftMarketplace.address);
  const { account, chainId } = useWeb3React<Web3Provider>();

  const [marketplaceData, setMarketplaceData] = useState<MarketplaceData>(defaultMarketplaceData);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [info, setInfo] = useState<InfoType>({});

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER}/api/nftsOfAddress/${account}`);
      const nfts = await res.json();
      setMarketplaceData(nfts);
    };
    if (account) {
      fetchData();
    }
  }, [account]);

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
          {info.link && info.hash && <Link href={info.link}>{shortenHex(info.hash, 4)}</Link>}
        </Alert>
      )}
      {info.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {info.error}
        </Alert>
      )}
      {marketplaceData.listedItemsByOthers &&
        Object.keys(marketplaceData.listedItemsByOthers).map((key, index) => (
          <Box key={index}>
            <h3>Collection: {key}</h3>
            <Grid container spacing={3}>
              {marketplaceData.listedItemsByOthers[key].map((token, index2) => (
                <Grid item lg={3} key={index2}>
                  <MediaCard
                    tokenData={token}
                    handlePurchase={handlePurchase}
                    transactionInProgress={transactionInProgress}
                  ></MediaCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      <Backdrop
        sx={{ color: "#fff", flexDirection: "column", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={transactionInProgress}
      >
        <CircularProgress color="inherit" sx={{ mb: 3 }} />
        {info.info && (
          <Alert severity="info">
            {info.info}{" "}
            {info.link && info.hash && <Link href={info.link}>{shortenHex(info.hash, 4)}</Link>}
          </Alert>
        )}
      </Backdrop>
    </>
  );
};

export default Marketplace;
