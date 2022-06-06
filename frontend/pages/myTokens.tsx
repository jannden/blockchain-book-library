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
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MediaCard from "../components/MediaCard";
import {
  InfoType,
  Inputs,
  defaultInputs,
  MarketplaceData,
  defaultMarketplaceData,
  Dialogs,
  defaultDialogs,
  DialogActionTypes,
  DialogToken,
  defaultDialogToken,
} from "../utils/types";

const Marketplace = () => {
  const nftMarketplaceContract = useNftMarketplaceContract(deployedNftMarketplace.address);
  const { library, account, chainId } = useWeb3React<Web3Provider>();

  const [dialogs, setDialogs] = useState<Dialogs>(defaultDialogs);
  const [dialogToken, setDialogToken] = useState<DialogToken>(defaultDialogToken);

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

  const handleDialogOpening = (
    action: DialogActionTypes,
    nftAddress?: string,
    tokenId?: string
  ) => {
    // Update info about the token we open the dialog for
    setDialogToken({ nftAddress, tokenId });

    // Update info about which dialog is open
    switch (action) {
      case DialogActionTypes.DEPLOY_COLLECTION:
        setDialogs((prevState) => ({ ...prevState, deployCollection: true }));
        break;
      case DialogActionTypes.MINT_TOKEN:
        setDialogs((prevState) => ({ ...prevState, mintToken: true }));
        break;
      case DialogActionTypes.LIST_ITEM:
        setDialogs((prevState) => ({ ...prevState, listItem: true }));
        break;
      case DialogActionTypes.CANCEL_LISTING:
        setDialogs((prevState) => ({ ...prevState, cancelListing: true }));
        break;
    }
  };

  const closeDialogs = () => {
    // Reset dialogs
    setDialogToken(defaultDialogToken);
    setDialogs(defaultDialogs);
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
    setDialogs(defaultDialogs);

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
      setDialogToken(defaultDialogToken);
    }
  };

  /////////////////////
  //  Mint new token //
  /////////////////////

  const mintToken = async () => {
    // Checking user input
    const image = tokenImage.current?.files?.[0];
    if (!image || !inputs.tokenName) {
      setInfo({ error: "Fill out the fields." });
      return;
    }
    setInfo({});
    setTransactionInProgress(true);
    setDialogs(defaultDialogs);

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
      const collectionContract = await getCollectionContract(signer, dialogToken.nftAddress, null);

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
      setDialogToken(defaultDialogToken);
    }
  };

  /////////////////////
  //     List Item   //
  /////////////////////

  const listItem = async () => {
    // Checking user input
    if (!inputs.price) {
      setInfo({ error: "Fill out the fields." });
      return;
    }
    setInfo({});
    setTransactionInProgress(true);
    setDialogs(defaultDialogs);

    try {
      // Preparing the contract
      const signer = library.getSigner(account);
      const collectionContract = await getCollectionContract(signer, dialogToken.nftAddress, null);
      let tx = await collectionContract.approve(
        nftMarketplaceContract.address,
        dialogToken.tokenId
      );
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
        dialogToken.nftAddress,
        dialogToken.tokenId,
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
      setDialogToken(defaultDialogToken);
    }
  };

  /////////////////////
  //  Cancel Listing //
  /////////////////////

  const cancelListing = async () => {
    setInfo({});
    setTransactionInProgress(true);
    setDialogs(defaultDialogs);

    try {
      const tx = await nftMarketplaceContract.cancelListing(
        dialogToken.nftAddress,
        dialogToken.tokenId
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
      setDialogToken(defaultDialogToken);
    }
  };

  if (!!account === false) {
    return null;
  }

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
          <Button
            variant="contained"
            onClick={handleDialogOpening.bind(this, DialogActionTypes.DEPLOY_COLLECTION)}
            disabled={transactionInProgress}
          >
            Deploy a new collection
          </Button>
        </Grid>
        <Grid item lg={12}>
          {marketplaceData.userAllCollections &&
            marketplaceData.userAllCollections.map(({ nftAddress }) => (
              <Box key={shortenHex(nftAddress)}>
                <h3>Collection: {nftAddress}</h3>
                <Grid container spacing={3}>
                  {marketplaceData.userItems[nftAddress] &&
                    marketplaceData.userItems[nftAddress].map((token, index2) => (
                      <Grid item lg={3} key={index2}>
                        <MediaCard
                          tokenData={token}
                          transactionInProgress={transactionInProgress}
                          handleDialogOpening={handleDialogOpening}
                        ></MediaCard>
                      </Grid>
                    ))}
                  <Grid item lg={3}>
                    <Box
                      sx={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        variant="outlined"
                        onClick={handleDialogOpening.bind(
                          this,
                          DialogActionTypes.MINT_TOKEN,
                          nftAddress
                        )}
                        disabled={transactionInProgress}
                      >
                        Mint new token
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))}
        </Grid>
      </Grid>
      <Dialog open={dialogs.deployCollection} onClose={closeDialogs}>
        <DialogTitle>Deploy collection</DialogTitle>
        <DialogContent>
          <DialogContentText>Set the details for your new collection.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="nftName"
            label="NFT Name"
            type="text"
            fullWidth
            variant="standard"
            onChange={inputHandler}
            value={inputs.nftName}
            disabled={transactionInProgress}
          />
          <TextField
            margin="dense"
            name="nftSymbol"
            label="NFT Symbol"
            type="text"
            fullWidth
            variant="standard"
            onChange={inputHandler}
            value={inputs.nftSymbol}
            disabled={transactionInProgress}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Cancel</Button>
          <Button onClick={deployCollection}>Deploy</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={dialogs.mintToken} onClose={closeDialogs}>
        <DialogTitle>Mint token</DialogTitle>
        <DialogContent>
          <DialogContentText>What token would you like to mint?</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="tokenName"
            label="Token Name"
            type="text"
            fullWidth
            variant="standard"
            onChange={inputHandler}
            value={inputs.tokenName}
            disabled={transactionInProgress}
          />
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
              sx={{ mt: 2, width: "100%" }}
              disabled={transactionInProgress}
            >
              {inputs.tokenImage ? inputs.tokenImage : "Choose Image"}
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Cancel</Button>
          <Button onClick={mintToken}>Mint</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={dialogs.listItem} onClose={closeDialogs}>
        <DialogTitle>List token</DialogTitle>
        <DialogContent>
          <DialogContentText>Which price do you want to sell the token for?</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="price"
            label="Price"
            type="number"
            fullWidth
            variant="standard"
            onChange={inputHandler}
            value={inputs.price}
            disabled={transactionInProgress}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Cancel</Button>
          <Button onClick={listItem}>List Item</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={dialogs.cancelListing} onClose={closeDialogs}>
        <DialogTitle>Cancel listing</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to remove the token from the marketplace?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Disagree</Button>
          <Button onClick={cancelListing} autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
      <Backdrop
        sx={{ color: "#fff", flexDirection: "column", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={transactionInProgress}
      >
        <CircularProgress color="inherit" sx={{ mb: 3 }} />
        {info.info && (
          <Alert severity="info">
            {info.info}{" "}
            {info.link && info.hash && <Link href={info.link}>{shortenHex(info.hash)}</Link>}
          </Alert>
        )}
      </Backdrop>
    </>
  );
};

export default Marketplace;
