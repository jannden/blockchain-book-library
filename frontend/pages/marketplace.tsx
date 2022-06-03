import type { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { ethers } from "ethers";
import { useEffect, useState, useRef } from "react";
import { getCollectionContract, ipfs, ipfsPath } from "../utils/util";
import { createClient } from "urql";
import { deployedNftMarketplace } from "../utils/deployedContracts";
import useNftMarketplaceContract from "../hooks/useNftMarketplaceContract";
import { create as createIpsf, IPFSHTTPClient } from "ipfs-http-client";
import { formatEtherscanLink, shortenHex } from "../utils/util";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import MediaCard from "../components/MediaCard";
import {
  InfoType,
  Inputs,
  defaultInputs,
  MarketplaceData,
  defaultMarketplaceData,
} from "../utils/types";

const Marketplace = () => {
  const nftMarketplaceContract = useNftMarketplaceContract(deployedNftMarketplace.address);
  const { library, account, chainId } = useWeb3React<Web3Provider>();

  const [marketplaceData, setMarketplaceData] = useState<MarketplaceData>(defaultMarketplaceData);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [info, setInfo] = useState<InfoType>({});
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const tokenImage = useRef(null);

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

  const inputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    switch (e.target.name) {
      case "nftName":
        setInputs((inputs) => ({ ...inputs, nftName: e.target.value }));
        break;
      case "nftSymbol":
        setInputs((inputs) => ({ ...inputs, nftSymbol: e.target.value }));
        break;
      case "nftAddress":
        setInputs((inputs) => ({ ...inputs, nftAddress: e.target.value }));
        break;
      case "tokenId":
        setInputs((inputs) => ({ ...inputs, tokenId: e.target.value }));
        break;
      case "price":
        setInputs((inputs) => ({ ...inputs, price: e.target.value }));
        break;
      case "tokenName":
        setInputs((inputs) => ({ ...inputs, tokenName: e.target.value }));
        break;
      case "tokenImage":
        setInputs((inputs) => ({ ...inputs, tokenImage: e.target.files?.[0]?.name || "" }));
        break;
    }
  };

  /////////////////////
  //Deploy Collection//
  /////////////////////

  const deployCollection = async () => {
    // Checking user input
    if (!inputs.nftName || !inputs.nftSymbol) {
      setInfo({ error: "Fill out the fields." });
      return;
    }
    setInfo({});
    setTransactionInProgress(true);

    // Preparing the contract
    setInfo({
      info: "Deploying...",
    });
    const signer = library.getSigner(account);
    const collectionContract = await getCollectionContract(signer, null, [
      inputs.nftName,
      inputs.nftSymbol,
      nftMarketplaceContract.address,
    ]);

    // Storing collection address in the marketplace
    try {
      const tx = await nftMarketplaceContract.addCollection(collectionContract.address);
      setInfo({
        info: "Transaction pending...",
        link: formatEtherscanLink("Transaction", [tx.chainId || chainId, tx.hash]),
        hash: shortenHex(tx.hash),
      });
      setInfo((prevInfo) => ({ ...prevInfo, info: "Transaction completed." }));
    } catch (error) {
      setInfo({ error: error.error?.message || error.errorArgs?.[0] || error.message });
    } finally {
      setTransactionInProgress(false);
    }
  };

  /////////////////////
  //  Mint new token //
  /////////////////////

  const mintToken = async () => {
    // Checking user input
    const image = tokenImage.current?.files?.[0];
    if (!image || !inputs.tokenName || !inputs.nftAddress) {
      setInfo({ error: "Fill out the fields." });
      return;
    }
    setInfo({});
    setTransactionInProgress(true);

    try {
      // Upload the image
      const uploadedImage = await ipfs.add(image);
      const imagePath = `${ipfsPath}/${uploadedImage.path}`;

      // Upload JSON Metadata
      const metadata = { tokenName: inputs.tokenName, tokenImage: imagePath };
      const uploadedMetadata = await ipfs.add(Buffer.from(JSON.stringify(metadata)));
      const metadataPath = `${ipfsPath}/${uploadedMetadata.path}`;

      // Preparing the contract
      const signer = library.getSigner(account);
      const collectionContract = await getCollectionContract(signer, inputs.nftAddress, null);

      // Mint
      const tx = await collectionContract.safeMint(account, metadataPath);
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

  /////////////////////
  //     List Item   //
  /////////////////////

  const listItem = async () => {
    // Checking user input
    if (!inputs.nftAddress || !inputs.tokenId || !inputs.price) {
      setInfo({ error: "Fill out the fields." });
      return;
    }
    setInfo({});
    setTransactionInProgress(true);

    try {
      // Preparing the contract
      const signer = library.getSigner(account);
      const collectionContract = await getCollectionContract(signer, inputs.nftAddress, null);
      let tx = await collectionContract.approve(nftMarketplaceContract.address, inputs.tokenId);
      setInfo({
        info: "Transaction pending...",
        link: formatEtherscanLink("Transaction", [tx.chainId || chainId, tx.hash]),
        hash: shortenHex(tx.hash),
      });
      await tx.wait();

      // Find out listing fee
      const listingFee = await nftMarketplaceContract.listingFee();

      // List item
      setInfo((prevInfo) => ({ ...prevInfo, info: "Transaction completed." }));
      tx = await nftMarketplaceContract.listItem(
        inputs.nftAddress,
        inputs.tokenId,
        ethers.utils.parseEther(inputs.price),
        {
          value: listingFee,
        }
      );
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

  /////////////////////
  //  Cancel Listing //
  /////////////////////

  const cancelListing = async () => {
    // Checking user input
    if (!inputs.nftAddress || !inputs.tokenId) {
      setInfo({ error: "Fill out the fields." });
      return;
    }
    setInfo({});
    setTransactionInProgress(true);

    try {
      const tx = await nftMarketplaceContract.cancelListing(inputs.nftAddress, inputs.tokenId);
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

  /////////////////////
  // Withdraw Funds  //
  /////////////////////

  /*
  const withdrawFunds = async () => {
    setInfo({});
    setTransactionInProgress(true);

    try {
      const tx = await nftMarketplaceContract.withdrawFunds();
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
  */

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
      <Grid container spacing={3}>
        <Grid item lg={3}>
          <Paper
            sx={{
              p: 2,
            }}
          >
            <h3>Create NFT Collection</h3>
            <Box
              sx={{ display: "flex", flexDirection: "column", "& .MuiTextField-root": { mb: 2 } }}
            >
              <TextField
                variant="outlined"
                name="nftName"
                label="NFT Collection Name"
                onChange={inputHandler}
                value={inputs.nftName}
                disabled={transactionInProgress}
              />
              <TextField
                variant="outlined"
                name="nftSymbol"
                label="NFT Collection Symbol"
                onChange={inputHandler}
                value={inputs.nftSymbol}
                disabled={transactionInProgress}
              />
              <Button
                variant="contained"
                onClick={deployCollection}
                disabled={transactionInProgress}
              >
                Deploy Collection
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item lg={3}>
          <Paper
            sx={{
              p: 2,
            }}
          >
            <Box
              sx={{ display: "flex", flexDirection: "column", "& .MuiTextField-root": { mb: 2 } }}
            >
              <h3>Mint a new token</h3>
              <TextField
                variant="outlined"
                name="tokenName"
                label="Token Name"
                onChange={inputHandler}
                value={inputs.tokenName}
                disabled={transactionInProgress}
              />
              <TextField
                select
                label="NFT Collection"
                name="nftAddress"
                value={inputs.nftAddress}
                onChange={inputHandler}
                disabled={transactionInProgress}
              >
                {marketplaceData.userMintableCollections &&
                  marketplaceData.userMintableCollections.map((item, index) => (
                    <MenuItem key={shortenHex(item.nftAddress)} value={item.nftAddress}>
                      {shortenHex(item.nftAddress)}
                    </MenuItem>
                  ))}
              </TextField>
              <label htmlFor="tokenImage">
                <input
                  ref={tokenImage}
                  id="tokenImage"
                  name="tokenImage"
                  style={{ visibility: "hidden", height: 0, width: 0 }}
                  type="file"
                  accept="image/*"
                  onChange={inputHandler}
                  disabled={transactionInProgress}
                />
                <Button
                  variant="outlined"
                  component="span"
                  sx={{ mb: 2, width: "100%" }}
                  disabled={transactionInProgress}
                >
                  {inputs.tokenImage ? inputs.tokenImage : "Choose Image"}
                </Button>
              </label>
              <Button variant="contained" onClick={mintToken} disabled={transactionInProgress}>
                Mint NFT
              </Button>
              {!ipfs && <p>Oh oh, Not connected to IPFS. Checkout out the logs for errors</p>}
            </Box>
          </Paper>
        </Grid>
        <Grid item lg={3}>
          <Paper
            sx={{
              p: 2,
            }}
          >
            <Box
              sx={{ display: "flex", flexDirection: "column", "& .MuiTextField-root": { mb: 2 } }}
            >
              <h3>List token</h3>
              <TextField
                select
                label="NFT Collection"
                name="nftAddress"
                value={inputs.nftAddress}
                onChange={inputHandler}
                disabled={transactionInProgress}
              >
                {marketplaceData.userAllCollections &&
                  marketplaceData.userAllCollections.map((item, index) => (
                    <MenuItem key={shortenHex(item.nftAddress)} value={item.nftAddress}>
                      {shortenHex(item.nftAddress)}
                    </MenuItem>
                  ))}
              </TextField>
              <TextField
                variant="outlined"
                name="tokenId"
                type="number"
                label="Token Id"
                onChange={inputHandler}
                value={inputs.tokenId}
                disabled={transactionInProgress}
              />
              <TextField
                variant="outlined"
                name="price"
                type="number"
                label="Price"
                onChange={inputHandler}
                value={inputs.price}
                disabled={transactionInProgress}
              />
              <Button variant="contained" onClick={listItem} disabled={transactionInProgress}>
                List token
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item lg={3}>
          <Paper
            sx={{
              p: 2,
            }}
          >
            <Box
              sx={{ display: "flex", flexDirection: "column", "& .MuiTextField-root": { mb: 2 } }}
            >
              <h3>Cancel listing</h3>
              <TextField
                select
                label="NFT Collection"
                name="nftAddress"
                value={inputs.nftAddress}
                onChange={inputHandler}
                disabled={transactionInProgress}
              >
                {marketplaceData.userAllCollections &&
                  marketplaceData.userAllCollections.map((item, index) => (
                    <MenuItem key={shortenHex(item.nftAddress)} value={item.nftAddress}>
                      {shortenHex(item.nftAddress)}
                    </MenuItem>
                  ))}
              </TextField>
              <TextField
                variant="outlined"
                name="tokenId"
                type="number"
                label="Token Id"
                onChange={inputHandler}
                value={inputs.tokenId}
                disabled={transactionInProgress}
              />
              <Button variant="contained" onClick={cancelListing} disabled={transactionInProgress}>
                Cancel listing
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item lg={12}>
          <h2>Owned tokens grouped by NFT collections (Minted + Bought / Listed + Not Listed)</h2>

          {marketplaceData.userItems &&
            Object.keys(marketplaceData.userItems).map((key, index) => (
              <Box key={index}>
                <Divider
                  sx={{
                    mt: 5,
                    mb: 3,
                  }}
                />
                <h3>Collection: {key}</h3>
                <Grid container spacing={3}>
                  {marketplaceData.userItems[key].map((token, index2) => (
                    <Grid item lg={3} key={index2}>
                      <MediaCard tokenData={token}></MediaCard>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
        </Grid>
        <Grid item lg={12}>
          <h2>Tokens for sale (with option to buy)</h2>
          {marketplaceData.currentlyListedItems &&
            Object.keys(marketplaceData.currentlyListedItems).map((key, index) => (
              <Box key={index}>
                <Divider
                  sx={{
                    mt: 5,
                    mb: 3,
                  }}
                />
                <h3>Collection: {key}</h3>
                <Grid container spacing={3}>
                  {marketplaceData.currentlyListedItems[key].map((token, index2) => (
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
        </Grid>
      </Grid>
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
