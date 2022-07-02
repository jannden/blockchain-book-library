// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

interface NftMarketplaceInterface {
  function listings(address _nftAddress, uint256 _tokenId)
    external
    view
    returns (uint256);

  function cancelListing(address _nftAddress, uint256 _tokenId) external;
}

contract NftCollection is
  ERC721,
  ERC721Burnable,
  ERC721Enumerable,
  ERC721URIStorage,
  Ownable
{
  using Counters for Counters.Counter;

  Counters.Counter private tokenIdCounter;

  NftMarketplaceInterface public marketplace;

  constructor(
    string memory _name,
    string memory _symbol,
    address _marketplace
  ) ERC721(_name, _symbol) {
    marketplace = NftMarketplaceInterface(_marketplace);
  }

  function safeMint(address _to, string memory _uri) public onlyOwner {
    uint256 tokenId = tokenIdCounter.current();
    tokenIdCounter.increment();
    _safeMint(_to, tokenId);
    _setTokenURI(tokenId, _uri);
  }

  function _afterTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenId
  ) internal virtual override(ERC721) {
    if (marketplace.listings(address(this), _tokenId) != 0) {
      marketplace.cancelListing(address(this), _tokenId);
    }
    super._afterTokenTransfer(_from, _to, _tokenId);
  }

  // The following functions are overrides required by Solidity.

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
  {
    return super.tokenURI(tokenId);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
