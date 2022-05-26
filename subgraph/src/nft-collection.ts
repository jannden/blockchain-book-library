import {
  Transfer as TransferEvent,
  Approval as ApprovalEvent
} from "../generated/NftCollection/NftCollection";
import { Transfer, Approval } from "../generated/schema";

export function handleTransfer(event: TransferEvent): void {
  const entity = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.tokenId = event.params.tokenId;
  entity.save();
}

export function handleApproval(event: ApprovalEvent): void {
  const entity = new Approval(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.owner = event.params.owner;
  entity.approved = event.params.approved;
  entity.tokenId = event.params.tokenId;
  entity.save();
}