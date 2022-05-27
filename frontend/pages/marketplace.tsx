import type { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { ContractFactory, ethers } from "ethers";
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
  const [data, setData] = useState([]);

  const graphUrl = "https://api.studio.thegraph.com/query/28136/nftmarketplace/v0.5";
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
      console.log("currentlyListedItems", currentlyListedItems);

      /*
       * Get items owned by the user grouped by NFT collections
       * (Minted + Bought / Listed + Not Listed)
       * Not listed minted tokens can be accessed by iterating over all user collections calling
       * balanceOf() and then tokenOfOwnerByIndex(). Any tokens that are owned by the user and
       * have ever been listed on the marketplace can be omitted, as they will be fetched from
       * the marketplace events.
       */
      const mergedMarketplace = [...itemListeds, ...itemCanceleds, ...itemBoughts];
      const ownedByUserEverListed = mergedMarketplace.filter((token) => token.owner == account);
      console.log("ownedByUserEverListed", ownedByUserEverListed);
      const allOwned = [...ownedByUserEverListed];
      const userCollections = collectionAddeds.filter((token) => token.deployer == account);
      console.log("userCollections", userCollections);
      for (const collection of userCollections) {
        const signer = library.getSigner(account);
        const contract = await getCollectionContract(signer, collection.nftAddress, null);
        const tokenCount = await contract.balanceOf(account);
        for (let i = 0; i < tokenCount; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(i);
          if (
            mergedMarketplace.some(
              (token) => token.nftAddress == collection.nftAddress && token.tokenId == tokenId
            )
          ) {
            continue;
          }
          const tokenUri = await contract.tokenURI(tokenId);
          allOwned.push({ tokenId, tokenUri });
        }
      }
      // Remove duplicates
      const allOwnedCleaned = allOwned.filter(
        (thing, index, self) =>
          self.findIndex(
            (t) => t.tokenId === thing.tokenId && t.nftCollection === thing.nftCollection
          ) === index
      );
      setData(currentlyListedItems);
    }
    fetchGraph();
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
    const contract = Factory.attach(contractAddress);
    return contract;
  }
  const contract = await Factory.deploy(...(args || []));
  await contract.deployed();
  return contract;
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
};

const defaultInputs: Inputs = {
  nftName: "",
  nftSymbol: "",
  nftAddress: "",
};

const Marketplace = () => {
  const nftMarketplaceContract = useNftMarketplaceContract(deployedNftMarketplace.address);
  const { library, account, chainId } = useWeb3React<Web3Provider>();
  const graphResult = useGraph();

  const [loading, setLoading] = useState<boolean>(false);
  const [info, setInfo] = useState<InfoType>({});

  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const tokenImage = useRef(null);

  useEffect(() => {
    console.log("graphResult", graphResult);
  }, [graphResult]);

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
    const contract = await getCollectionContract(signer, null, [
      inputs.nftName,
      inputs.nftSymbol,
      deployedNftMarketplace.address,
    ]);

    // Storing collection address in the marketplace
    const tx = await nftMarketplaceContract.addCollection(contract.address);
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
      const contract = await getCollectionContract(signer, inputs.nftAddress, null);

      // Mint
      const safeMint = await contract.safeMint(account, imagePath);
      const result = await safeMint.wait();

      console.log(result);
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
          <p>
            Not listed minted tokens can be accessed by iterating over all user collections calling
            balanceOf() and then tokenOfOwnerByIndex(). Any tokens that are owned by the user and
            have ever been listed on the marketplace can be omitted, as they will be fetched from
            the marketplace events.
          </p>
          <h4>Add token to the marketplace</h4>
          <h4>Remove token from the marketplace</h4>
          <h4>Tokens for sale (with option to buy)</h4>
        </div>
      </div>
    </>
  );
};

export default Marketplace;
