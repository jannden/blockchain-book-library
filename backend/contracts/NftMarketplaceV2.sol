// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IERC721Ownable is IERC721 {
  function owner() external returns (address);
}

contract NftMarketplaceV2 is ReentrancyGuard, Ownable {
  /////////////////////
  //     Events      //
  /////////////////////
  event ItemListed(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );

  event ItemCanceled(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId
  );

  event ItemBought(
    address indexed buyer,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );

  event CollectionAdded(address indexed deployer, address indexed nftAddress);

  /////////////////////
  //     Storage     //
  /////////////////////

  /// @notice NftAddress -> Token ID -> Price
  mapping(address => mapping(uint256 => uint256)) public listings;

  /// @notice UserAddress -> Funds
  // For increased security: https://fravoll.github.io/solidity-patterns/pull_over_push.html
  // Why using call: https://consensys.github.io/smart-contract-best-practices/development-recommendations/general/external-calls/#dont-use-transfer-or-send
  // Good practice: https://docs.soliditylang.org/en/develop/security-considerations.html?highlight=check%20effects#use-the-checks-effects-interactions-pattern
  // mapping(address => uint256) private funds;

  /// @notice UserAddress -> Deployed NFT contract addresses
  mapping(address => address[]) public nfts;

  /// @notice Marketplace fee
  uint256 public listingFee = 0.01 ether;

  /////////////////////
  //    Modifiers    //
  /////////////////////

  modifier notYetListed(
    address nftAddress,
    uint256 tokenId,
    address owner
  ) {
    require(listings[nftAddress][tokenId] == 0, "Shouldn't be listed.");
    _;
  }

  modifier alreadyListed(address nftAddress, uint256 tokenId) {
    require(listings[nftAddress][tokenId] > 0, "Should be listed.");
    _;
  }

  modifier tokenOwner(
    address nftAddress,
    uint256 tokenId,
    address spender
  ) {
    IERC721 nft = IERC721(nftAddress);
    address owner = nft.ownerOf(tokenId);
    require(spender == owner, "Should be owner of the token.");
    _;
  }

  /////////////////////
  //    Functions    //
  /////////////////////

  /// @notice Method for listing an NFT
  /// @param _nftAddress Address of NFT contract
  /// @param _tokenId Token ID of NFT
  /// @param _price Sale price
  function listItem(
    address _nftAddress,
    uint256 _tokenId,
    uint256 _price
  )
    external
    payable
    nonReentrant
    notYetListed(_nftAddress, _tokenId, msg.sender)
    tokenOwner(_nftAddress, _tokenId, msg.sender)
  {
    require(_price > 0, "Price not set.");
    require(msg.value == listingFee, "Listing fee not met.");
    IERC721 nft = IERC721(_nftAddress);
    require(
      nft.getApproved(_tokenId) == address(this),
      "Approve marketplace first."
    );

    // Set the price of the token (which lists it in the marketplace)
    listings[_nftAddress][_tokenId] = _price;

    // Add the listing fee to the funds for the contract owner
    address owner = owner();
    // funds[owner] += msg.value;
    (bool success, ) = payable(owner).call{value: msg.value}(""); // when funds aren't used
    require(success, "Transfer failed"); // when funds aren't used

    // Emit event
    emit ItemListed(msg.sender, _nftAddress, _tokenId, _price);
  }

  /// @notice Method for cancelling a listing
  /// @param _nftAddress Address of NFT contract
  /// @param _tokenId Token ID of NFT
  function cancelListing(address _nftAddress, uint256 _tokenId)
    external
    alreadyListed(_nftAddress, _tokenId)
  {
    IERC721 nft = IERC721(_nftAddress);
    address owner = nft.ownerOf(_tokenId);
    require(
      msg.sender == owner || msg.sender == _nftAddress,
      "Caller isn't owner or nft contract."
    );
    delete (listings[_nftAddress][_tokenId]);
    emit ItemCanceled(msg.sender, _nftAddress, _tokenId);
  }

  /// @notice Method for buying listing
  /// @notice The owner of the NFT needs to approve the Marketplace first
  /// @param _nftAddress Address of NFT contract
  /// @param _tokenId Token ID of NFT
  function buyItem(address _nftAddress, uint256 _tokenId)
    external
    payable
    alreadyListed(_nftAddress, _tokenId)
    nonReentrant
  {
    require(msg.value == listings[_nftAddress][_tokenId], "Price mismatch.");
    IERC721 nft = IERC721(_nftAddress);
    address owner = nft.ownerOf(_tokenId);
    // funds[owner] += msg.value;
    delete (listings[_nftAddress][_tokenId]);
    IERC721(_nftAddress).safeTransferFrom(owner, msg.sender, _tokenId);
    (bool success, ) = payable(owner).call{value: msg.value}(""); // when funds aren't used
    require(success, "Transfer failed"); // when funds aren't used
    emit ItemBought(msg.sender, _nftAddress, _tokenId, msg.value);
  }

  /// @notice Method for storing addresses of NFT contracts deployed by users
  function addCollection(address _nftAddress) external {
    require(
      msg.sender == IERC721Ownable(_nftAddress).owner(),
      "Only collection owner can add it."
    );
    for (uint256 i = 0; i < nfts[msg.sender].length; i++) {
      require(nfts[msg.sender][i] != _nftAddress, "Collection already exists.");
    }
    nfts[msg.sender].push(_nftAddress);
    emit CollectionAdded(msg.sender, _nftAddress);
  }

  /// @notice Method for withdrawing earned funds
  /*
  function withdrawFunds() external {
    require(funds[msg.sender] > 0, "No funds to withdraw.");
    uint256 amountToWithdraw = funds[msg.sender];
    funds[msg.sender] = 0;
    (bool success, ) = payable(msg.sender).call{value: amountToWithdraw}("");
    require(success, "Transfer failed");
  }
  */

  /// @notice Method for changing the listing fee
  function setListingFee(uint256 _newFee) external onlyOwner {
    require(_newFee > 0, "Fee should be above zero.");
    listingFee = _newFee;
  }
}
