import {
  ItemBought as ItemBoughtEvent,
  ItemCanceled as ItemCanceledEvent,
  ItemListed as ItemListedEvent,
} from "../generated/NftMarketplaceV2/NftMarketplaceV2";
import { NftCollection } from "../generated/NftCollection/NftCollection";
import { ItemBought, ItemCanceled, ItemListed } from "../generated/schema";

export function handleItemBought(event: ItemBoughtEvent): void {
  const entity = new ItemBought(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.buyer = event.params.buyer;
  entity.nftAddress = event.params.nftAddress;
  entity.tokenId = event.params.tokenId;
  entity.price = event.params.price;
  entity.timestamp = event.block.timestamp;
  let nftCollection = NftCollection.bind(event.params.nftAddress);
  entity.owner = nftCollection.ownerOf(event.params.tokenId);
  entity.nftUri = nftCollection.tokenURI(event.params.tokenId);
  entity.save();
}

export function handleItemCanceled(event: ItemCanceledEvent): void {
  const entity = new ItemCanceled(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.seller = event.params.seller;
  entity.nftAddress = event.params.nftAddress;
  entity.tokenId = event.params.tokenId;
  entity.timestamp = event.block.timestamp;
  let nftCollection = NftCollection.bind(event.params.nftAddress);
  entity.owner = nftCollection.ownerOf(event.params.tokenId);
  entity.nftUri = nftCollection.tokenURI(event.params.tokenId);
  entity.save();
}

export function handleItemListed(event: ItemListedEvent): void {
  const entity = new ItemListed(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.seller = event.params.seller;
  entity.nftAddress = event.params.nftAddress;
  entity.tokenId = event.params.tokenId;
  entity.price = event.params.price;
  entity.timestamp = event.block.timestamp;
  let nftCollection = NftCollection.bind(event.params.nftAddress);
  entity.owner = nftCollection.ownerOf(event.params.tokenId);
  entity.nftUri = nftCollection.tokenURI(event.params.tokenId);
  entity.save();
}
