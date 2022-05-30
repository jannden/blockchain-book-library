import type { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import { ethers } from "ethers";
import { useEffect, useState, useRef } from "react";
import nftCollectionFactory from "../contracts/NftCollection.json";
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

const ipfs: IPFSHTTPClient = createIpsf({
  url: "https://ipfs.infura.io:5001",
});

const useGraph = () => {
  const { library, account } = useWeb3React<Web3Provider>();
  const [graphData, setGraphData] = useState({
    currentlyListedItems: [],
    userItems: [],
    userMintableCollections: [],
    userAllCollections: [],
  });
  const [_, setRefreshGraph] = useState(0);

  const graphUrl = "https://api.studio.thegraph.com/query/28136/nftmarketplace/v0.8";
  const graphQuery = `
      query {
      itemListeds {
        id
        seller
        nftAddress
        tokenId
        price
        timestamp
        owner
        tokenUri
      }
      itemCanceleds {
        id
        seller
        nftAddress
        tokenId
        timestamp
        owner
        tokenUri
      }
      itemBoughts {
        id
        buyer
        nftAddress
        tokenId
        price
        timestamp
        owner
        tokenUri
      }
      collectionAddeds {
        id
        deployer
        nftAddress
        timestamp
      }
    }
  `;

  useEffect(() => {
    async function fetchGraph() {
      // Create connection to the Graph
      const client = createClient({ url: graphUrl });

      // Extract data
      const data = await client.query(graphQuery).toPromise();
      const { itemListeds, itemCanceleds, itemBoughts, collectionAddeds } = data.data;

      // Get items currently listed in the marketplace for purchase
      const mergedFilter = [...itemCanceleds, ...itemBoughts];
      const currentlyListedItems = removeDuplicates(
        itemListeds.filter((el: any) => {
          return !mergedFilter.some((f) => {
            return (
              f.nftAddress === el.nftAddress &&
              f.tokenId === el.tokenId &&
              f.timestamp > el.timestamp
            );
          });
        }),
        "nftAddress",
        "tokenId"
      ).filter((el: any) => el.owner != account.toLowerCase());

      /*
       * Get items owned by the user grouped by NFT collections
       * (Minted + Bought / Listed + Not Listed)
       * Not listed minted tokens can be accessed by iterating over all user collections calling
       * balanceOf() and then tokenOfOwnerByIndex(). Any tokens that are owned by the user and
       * have ever been listed on the marketplace can be omitted, as they will be fetched from
       * the marketplace events.
       */
      const mergedMarketplace = [...itemListeds, ...itemCanceleds, ...itemBoughts].sort(
        ({ timestamp: a }, { timestamp: b }) => b - a
      );
      const mergedMarketplaceWithoutDuplicates = removeDuplicates(
        mergedMarketplace,
        "nftAddress",
        "tokenId"
      );
      const ownedByUserEverListed = mergedMarketplaceWithoutDuplicates
        .filter((token) => token.owner == account.toLowerCase())
        .map((token) => ({
          nftAddress: token.nftAddress,
          tokenId: token.tokenId,
          tokenUri: token.tokenUri,
        }));
      const userItems = [...ownedByUserEverListed];

      const userMintableCollections = collectionAddeds.filter(
        (token) => token.deployer == account.toLowerCase()
      );
      for (const collection of userMintableCollections) {
        const signer = library.getSigner(account);
        const collectionContract = await getCollectionContract(signer, collection.nftAddress, null);
        const tokenCount = await collectionContract.balanceOf(account);
        for (let i = 0; i < tokenCount; i++) {
          const tokenId = (await collectionContract.tokenOfOwnerByIndex(account, i)).toNumber();
          if (
            mergedMarketplace.some(
              (token) => token.nftAddress == collection.nftAddress && token.tokenId == tokenId
            )
          ) {
            continue;
          }
          const tokenUri = await collectionContract.tokenURI(tokenId);
          userItems.push({ nftAddress: collection.nftAddress, tokenId, tokenUri });
        }
      }

      // Add collections that the user hasn't deployed but owns tokens from
      const mixOfCollections = [...userMintableCollections, ...userItems].map(
        (item) => item.nftAddress
      );
      const userAllCollections = mixOfCollections
        .filter((item, pos) => mixOfCollections.indexOf(item) == pos)
        .map((item) => ({ nftAddress: item }));

      setGraphData({
        currentlyListedItems: groupBy(currentlyListedItems, "nftAddress"),
        userItems: groupBy(userItems, "nftAddress"),
        userMintableCollections,
        userAllCollections,
      });
    }
    if (account) {
      fetchGraph();
    }
  }, [account, graphQuery, library, setRefreshGraph]);
  return { ...graphData, setRefreshGraph };
};

const groupBy = (items, key) => {
  const groupedObject = items.reduce(
    (result, item) => ({
      ...result,
      [item[key]]: [...(result[item[key]] || []), item],
    }),
    {}
  );
  return groupedObject;
};

const removeDuplicates = (arrayOfObjects, uniqueKey1, uniqueKey2) => {
  return arrayOfObjects.filter(
    (thing, index, self) =>
      self.findIndex(
        (t) => t[uniqueKey1] === thing[uniqueKey1] && t[uniqueKey2] === thing[uniqueKey2]
      ) === index
  );
};

const getCollectionContract = async (
  signer: JsonRpcSigner,
  contractAddress?: string,
  args?: any[]
): Promise<ethers.Contract> => {
  const Factory = new ethers.ContractFactory(
    nftCollectionFactory.abi,
    nftCollectionFactory.bytecode,
    signer
  );
  if (contractAddress) {
    const collectionContract = Factory.attach(contractAddress);
    return collectionContract;
  }
  const collectionContract = await Factory.deploy(...(args || []));
  await collectionContract.deployed();
  return collectionContract;
};

type InfoType = {
  error?: string;
  info?: string;
  link?: string;
  hash?: string;
};

type Inputs = {
  nftName: string;
  nftSymbol: string;
  nftAddress: string;
  tokenId: string;
  price: string;
  tokenImage: string;
};

const defaultInputs: Inputs = {
  nftName: "",
  nftSymbol: "",
  nftAddress: "",
  tokenId: "",
  price: "",
  tokenImage: "",
};

const Marketplace = () => {
  const nftMarketplaceContract = useNftMarketplaceContract(deployedNftMarketplace.address);
  const { library, account, chainId } = useWeb3React<Web3Provider>();
  const {
    currentlyListedItems,
    userItems,
    userMintableCollections,
    userAllCollections,
    setRefreshGraph,
  } = useGraph();

  const [loading, setLoading] = useState<boolean>(false);
  const [info, setInfo] = useState<InfoType>({});

  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const [selectedCollection, setSelectedCollection] = useState("");
  const tokenImage = useRef(null);

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
      return alert("Fill out the fields.");
    }
    setLoading(true);

    // Preparing the contract
    setInfo({
      info: "Deploying...",
    });
    const signer = library.getSigner(account);
    const collectionContract = await getCollectionContract(signer, null, [
      inputs.nftName,
      inputs.nftSymbol,
      deployedNftMarketplace.address,
    ]);

    // Storing collection address in the marketplace
    try {
      const tx = await nftMarketplaceContract.addCollection(collectionContract.address);
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
      setLoading(false);
      setRefreshGraph((prevValue) => prevValue++);
    }
  };

  /////////////////////
  //  Mint new token //
  /////////////////////

  const mintToken = async () => {
    // Checking user input
    const image = tokenImage.current?.files?.[0];
    if (!image || !inputs.nftAddress) {
      return alert("Fill out the fields.");
    }
    setLoading(true);

    try {
      // Upload the image
      const uploadedImage = await ipfs.add(image);
      const imagePath = `https://ipfs.infura.io/ipfs/${uploadedImage.path}`;

      // Preparing the contract
      const signer = library.getSigner(account);
      const collectionContract = await getCollectionContract(signer, inputs.nftAddress, null);

      // Mint
      const tx = await collectionContract.safeMint(account, imagePath);
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
      setLoading(false);
      setRefreshGraph((prevValue) => prevValue++);
    }
  };

  /////////////////////
  //     List Item   //
  /////////////////////

  const listItem = async () => {
    // Checking user input
    if (!inputs.nftAddress || !inputs.tokenId || !inputs.price) {
      return alert("Fill out the fields.");
    }
    setLoading(true);

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
      tx = await nftMarketplaceContract.listItem(inputs.nftAddress, inputs.tokenId, inputs.price, {
        value: listingFee,
      });
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
      setLoading(false);
      setRefreshGraph((prevValue) => prevValue++);
    }
  };

  /////////////////////
  //  Cancel Listing //
  /////////////////////

  const cancelListing = async () => {
    // Checking user input
    if (!inputs.nftAddress || !inputs.tokenId) {
      return alert("Fill out the fields.");
    }
    setLoading(true);

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
      setLoading(false);
      setRefreshGraph((prevValue) => prevValue++);
    }
  };

  /////////////////////
  //     Buy Item    //
  /////////////////////

  const handlePurchase = async (nftAddress, tokenId, price) => {
    // Checking user input
    if (!nftAddress || !tokenId || !price) {
      return alert("Fill out the fields.");
    }
    setLoading(true);

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
      setLoading(false);
      setRefreshGraph((prevValue) => prevValue++);
    }
  };

  /////////////////////
  // Withdraw Funds  //
  /////////////////////

  const withdrawFunds = async () => {
    setLoading(true);

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
      setLoading(false);
    }
  };

  return (
    <>
      {info.info && (
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
                disabled={loading}
              />
              <TextField
                variant="outlined"
                name="nftSymbol"
                label="NFT Collection Symbol"
                onChange={inputHandler}
                value={inputs.nftSymbol}
                disabled={loading}
              />
              <Button variant="contained" onClick={deployCollection} disabled={loading}>
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
                select
                label="NFT Collection"
                name="nftAddress"
                value={inputs.nftAddress}
                onChange={inputHandler}
                disabled={loading}
              >
                {userMintableCollections &&
                  userMintableCollections.map((item, index) => (
                    <MenuItem key={item.nftAddress} value={item.nftAddress}>
                      {shortenHex(item.nftAddress, 4)}
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
                  disabled={loading}
                />
                <Button
                  variant="outlined"
                  component="span"
                  sx={{ mb: 2, width: "100%" }}
                  disabled={loading}
                >
                  {inputs.tokenImage ? inputs.tokenImage : "Choose Image"}
                </Button>
              </label>
              <Button variant="contained" onClick={mintToken} disabled={loading}>
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
                disabled={loading}
              >
                {userAllCollections &&
                  userAllCollections.map((item, index) => (
                    <MenuItem key={item.nftAddress} value={item.nftAddress}>
                      {shortenHex(item.nftAddress, 4)}
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
                disabled={loading}
              />
              <TextField
                variant="outlined"
                name="price"
                type="number"
                label="Price"
                onChange={inputHandler}
                value={inputs.price}
                disabled={loading}
              />
              <Button variant="contained" onClick={listItem} disabled={loading}>
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
                disabled={loading}
              >
                {userAllCollections &&
                  userAllCollections.map((item, index) => (
                    <MenuItem key={item.nftAddress} value={item.nftAddress}>
                      {shortenHex(item.nftAddress, 4)}
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
                disabled={loading}
              />
              <Button variant="contained" onClick={cancelListing} disabled={loading}>
                Cancel listing
              </Button>
            </Box>
          </Paper>
          <Paper
            sx={{
              p: 2,
              mt: 2,
            }}
          >
            <Button variant="contained" onClick={withdrawFunds} disabled={loading}>
              Withdraw funds
            </Button>
          </Paper>
        </Grid>
        <Grid item lg={12}>
          <h2>Owned tokens grouped by NFT collections (Minted + Bought / Listed + Not Listed)</h2>

          {userItems &&
            Object.keys(userItems).map((key, index) => (
              <Box key={index}>
                <Divider
                  sx={{
                    mt: 5,
                    mb: 3,
                  }}
                />
                <h3>Collection: {key}</h3>
                <Grid container spacing={3}>
                  {userItems[key].map((token, index2) => (
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
          {currentlyListedItems &&
            Object.keys(currentlyListedItems).map((key, index) => (
              <Box key={index}>
                <Divider
                  sx={{
                    mt: 5,
                    mb: 3,
                  }}
                />
                <h3>Collection: {key}</h3>
                <Grid container spacing={3}>
                  {currentlyListedItems[key].map((token, index2) => (
                    <Grid item lg={3} key={index2}>
                      <MediaCard tokenData={token} handlePurchase={handlePurchase}></MediaCard>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
        </Grid>
      </Grid>
    </>
  );
};

export default Marketplace;
