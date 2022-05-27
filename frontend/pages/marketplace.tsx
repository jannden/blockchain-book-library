import type { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { BigNumber, ContractFactory, ethers } from "ethers";
import { useEffect, useState, useRef } from "react";
import nftCollectionFactory from "../contracts/NftCollection.json";
import { createClient } from "urql";
import { deployedNftMarketplace } from "../utils/deployedContracts";
import useNftMarketplaceContract from "../hooks/useNftMarketplaceContract";
import useNftCollectionContract from "../hooks/useNftCollectionContract";
import { create as createIpsf, CID, IPFSHTTPClient } from "ipfs-http-client";
import { formatEtherscanLink, shortenHex } from "../utils/util";

const ipfs: IPFSHTTPClient = createIpsf({
  url: "https://ipfs.infura.io:5001",
});

const useGraph = () => {
  const { library, account } = useWeb3React<Web3Provider>();
  const [data, setData] = useState({
    currentlyListedItems: [],
    userItems: [],
    userCollections: [],
  });

  const graphUrl = "https://api.studio.thegraph.com/query/28136/nftmarketplace/v0.7";
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
        nftUri
      }
      itemCanceleds {
        id
        seller
        nftAddress
        tokenId
        timestamp
        owner
        nftUri
      }
      itemBoughts {
        id
        buyer
        nftAddress
        tokenId
        price
        timestamp
        owner
        nftUri
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
      const currentlyListedItems = itemListeds.filter((el: any) => {
        return !mergedFilter.some((f) => {
          return (
            f.nftAddress === el.nftAddress && f.tokenId === el.tokenId && f.timestamp > el.timestamp
          );
        });
      });

      /*
       * Get items owned by the user grouped by NFT collections
       * (Minted + Bought / Listed + Not Listed)
       * Not listed minted tokens can be accessed by iterating over all user collections calling
       * balanceOf() and then tokenOfOwnerByIndex(). Any tokens that are owned by the user and
       * have ever been listed on the marketplace can be omitted, as they will be fetched from
       * the marketplace events.
       */
      const mergedMarketplace = [...itemListeds, ...itemCanceleds, ...itemBoughts];
      const mergedMarketplaceWithoutDuplicates = mergedMarketplace.filter(
        (thing, index, self) =>
          self.findIndex(
            (t) => t.tokenId === thing.tokenId && t.nftAddress === thing.nftAddress
          ) === index
      );
      const ownedByUserEverListed = mergedMarketplaceWithoutDuplicates.filter(
        (token) => token.owner == account.toLowerCase()
      );
      const userItems = [...ownedByUserEverListed];
      const userCollections = collectionAddeds.filter(
        (token) => token.deployer == account.toLowerCase()
      );
      for (const collection of userCollections) {
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

      setData({ currentlyListedItems, userItems, userCollections });
    }
    if (account) {
      fetchGraph();
    }
  }, [account, graphQuery, library]);
  return data;
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
};

const defaultInputs: Inputs = {
  nftName: "",
  nftSymbol: "",
  nftAddress: "",
  tokenId: "",
  price: "",
};

const Marketplace = () => {
  const nftMarketplaceContract = useNftMarketplaceContract(deployedNftMarketplace.address);
  const { library, account, chainId } = useWeb3React<Web3Provider>();
  const { currentlyListedItems, userItems, userCollections } = useGraph();

  const [loading, setLoading] = useState<boolean>(false);
  const [info, setInfo] = useState<InfoType>({});

  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const tokenImage = useRef(null);

  const inputHandler = (e) => {
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

    // Preparing the contract
    const signer = library.getSigner(account);
    const collectionContract = await getCollectionContract(signer, null, [
      inputs.nftName,
      inputs.nftSymbol,
      deployedNftMarketplace.address,
    ]);

    // Storing collection address in the marketplace
    const tx = await nftMarketplaceContract.addCollection(collectionContract.address);
    setInfo({
      info: "Transaction pending...",
      link: formatEtherscanLink("Transaction", [tx.chainId || chainId, tx.hash]),
      hash: shortenHex(tx.hash),
    });
    const receipt = await tx.wait();
    setInfo({
      info: "Transaction completed.",
    });
  };

  /////////////////////
  //  Mint new token //
  /////////////////////

  const mintToken = async () => {
    const image = tokenImage.current?.files?.[0];

    if (!image || !inputs.nftAddress) {
      return alert("Fill out the fields.");
    }

    try {
      // Upload the image
      const uploadedImage = await ipfs.add(image);
      const imagePath = `https://ipfs.infura.io/ipfs/${uploadedImage.path}`;

      // Preparing the contract
      const signer = library.getSigner(account);
      const collectionContract = await getCollectionContract(signer, inputs.nftAddress, null);

      // Mint
      const safeMint = await collectionContract.safeMint(account, imagePath);
      const result = await safeMint.wait();

      console.log(result);
    } catch (error) {
      console.log(error);
    }
  };

  /////////////////////
  //     List Item   //
  /////////////////////

  const listItem = async () => {
    if (!inputs.nftAddress || !inputs.tokenId || !inputs.price) {
      return alert("Fill out the fields.");
    }
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
      let receipt = await tx.wait();
      setInfo({
        info: "Transaction completed.",
      });
      tx = await nftMarketplaceContract.listItem(inputs.nftAddress, inputs.tokenId, inputs.price);
      setInfo({
        info: "Transaction pending...",
        link: formatEtherscanLink("Transaction", [tx.chainId || chainId, tx.hash]),
        hash: shortenHex(tx.hash),
      });
      receipt = await tx.wait();
      setInfo({
        info: "Transaction completed.",
      });
    } catch (error) {
      console.log(error);
    }
  };

  /////////////////////
  //  Cancel Listing //
  /////////////////////

  const cancelListing = async () => {
    if (!inputs.nftAddress || !inputs.tokenId) {
      return alert("Fill out the fields.");
    }
    try {
      const tx = await nftMarketplaceContract.cancelListing(inputs.nftAddress, inputs.tokenId);
      setInfo({
        info: "Transaction pending...",
        link: formatEtherscanLink("Transaction", [tx.chainId || chainId, tx.hash]),
        hash: shortenHex(tx.hash),
      });
      const receipt = await tx.wait();
      setInfo({
        info: "Transaction completed.",
      });
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      <h1>Marketplace</h1>
      <div>
        {info.info && <div className="info">{info.info}</div>}
        {info.link && info.hash && (
          <div>
            <a href={info.link}>{info.hash}</a>
          </div>
        )}
        {info.error && <div className="error">{info.error}</div>}
        <div>
          <h4>Create NFT Collection</h4>
          <label>
            NFT Collection Name
            <input type="text" name="nftName" onChange={inputHandler} value={inputs.nftName} />
          </label>
          <label>
            NFT Collection Symbol
            <input type="text" name="nftSymbol" onChange={inputHandler} value={inputs.nftSymbol} />
          </label>
          <button onClick={deployCollection}>Deploy Collection</button>
          <h4>Mint a new token</h4>
          <label>
            Token Image
            <input type="file" ref={tokenImage} />
          </label>
          <label>
            NFT Collection Address
            <input
              type="text"
              name="nftAddress"
              onChange={inputHandler}
              value={inputs.nftAddress}
            />
          </label>
          <button type="button" onClick={mintToken}>
            Mint NFT
          </button>
          {!ipfs && <p>Oh oh, Not connected to IPFS. Checkout out the logs for errors</p>}
          <h4>Owned tokens grouped by NFT collections (Minted + Bought / Listed + Not Listed)</h4>
          {userItems &&
            userItems.map((item, index) => (
              <p key={index}>
                {item.tokenUri}
                <br />
                {item.tokenId}
                <br />
                {item.nftAddress}
                <br />
                ----------------
              </p>
            ))}
          <h4>User collections</h4>
          {userCollections &&
            userCollections.map((item, index) => (
              <p key={index}>
                {item.nftAddress}
                <br />
                ----------------
              </p>
            ))}
          <h4>Add token to the marketplace</h4>
          <label>
            NFT Collection Address
            <input
              type="text"
              name="nftAddress"
              onChange={inputHandler}
              value={inputs.nftAddress}
            />
          </label>
          <label>
            Token Id
            <input type="text" name="tokenId" onChange={inputHandler} value={inputs.tokenId} />
          </label>
          <label>
            Price
            <input type="text" name="price" onChange={inputHandler} value={inputs.price} />
          </label>
          <button type="button" onClick={listItem}>
            List item
          </button>
          <h4>Remove token from the marketplace</h4>
          <label>
            NFT Collection Address
            <input
              type="text"
              name="nftAddress"
              onChange={inputHandler}
              value={inputs.nftAddress}
            />
          </label>
          <label>
            Token Id
            <input type="text" name="tokenId" onChange={inputHandler} value={inputs.tokenId} />
          </label>
          <button type="button" onClick={cancelListing}>
            Cancel listing
          </button>
          <h4>Tokens for sale (with option to buy)</h4>
          {currentlyListedItems &&
            currentlyListedItems.map((item, index) => (
              <p key={index}>
                {item.tokenUri}
                <br />
                {item.tokenId}
                <br />
                {item.nftAddress}
                <br />
                ----------------
              </p>
            ))}
        </div>
      </div>
    </>
  );
};

export default Marketplace;
