// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

import "hardhat/console.sol";
import "./NftCollection.sol";

contract NftMarketplace is ERC721Holder, ReentrancyGuard, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private itemsSold;

  uint256 marketplaceFee = 0.01 ether;

  struct Collection {
    address contractAddress;
    uint256 tokensMinted;
    address payable owner;
  }
  Collection[] public collections;

  struct MarketItem {
    uint256 collectionId;
    uint256 tokenId;
    uint256 price;
    address payable seller;
    address buyer;
  }
  MarketItem[] public marketItems;

  event MarketItemCreated(
    uint256 indexed collectionId,
    uint256 indexed tokenId,
    uint256 price,
    address seller,
    address buyer
  );

  event MarketItemSold(uint256 indexed itemId, address owner);

  function createCollection(string memory _name, string memory _symbol) public {
    NftCollection c = new NftCollection(_name, _symbol);
    // c.transferOwnership(msg.sender);
    collections.push(Collection(address(c), 0, payable(msg.sender)));
  }

  function mintNftFromCollection(uint256 _collectionId) public {
    require(
      msg.sender == collections[_collectionId].owner,
      "Collection owner mismatch."
    );
    NftCollection(collections[_collectionId].contractAddress).safeMint(
      msg.sender,
      ""
    );
    collections[_collectionId].tokensMinted++;
  }

  function addMarketItem(
    uint256 _collectionId,
    uint256 _tokenId,
    uint256 _price
  ) public payable nonReentrant {
    require(msg.value == marketplaceFee, "Marketplace fee not met.");
    require(_price > 0, "Price not set.");
    require(
      address(this) ==
        NftCollection(collections[_collectionId].contractAddress).ownerOf(
          _tokenId
        ),
      "Token not transferred."
    );

    marketItems.push(
      MarketItem(
        _collectionId,
        _tokenId,
        _price,
        payable(msg.sender),
        address(0)
      )
    );

    payable(owner()).transfer(msg.value);

    emit MarketItemCreated(
      _collectionId,
      _tokenId,
      _price,
      msg.sender,
      address(0)
    );
  }

  function sellMarketItem(uint256 _itemId) public payable nonReentrant {
    require(marketItems[_itemId].price == msg.value, "Price mismatch.");
    require(marketItems[_itemId].buyer == address(0), "Item already sold.");

    NftCollection(
      collections[marketItems[_itemId].collectionId].contractAddress
    ).transferFrom(address(this), msg.sender, marketItems[_itemId].tokenId);
    itemsSold.increment();
    marketItems[_itemId].buyer = msg.sender;
    marketItems[_itemId].seller.transfer(msg.value);
    emit MarketItemSold(_itemId, msg.sender);
  }

  function fetchMarketItems() public view returns (MarketItem[] memory) {
    uint256 totalItemCount = marketItems.length;
    uint256 unsoldItemCount = totalItemCount - itemsSold.current();
    uint256 counter = 0;

    MarketItem[] memory items = new MarketItem[](unsoldItemCount);
    for (uint256 i = 0; i < totalItemCount; i++) {
      if (marketItems[i].buyer == address(0)) {
        items[counter] = marketItems[i];
        counter++;
      }
    }
    return items;
  }
}
