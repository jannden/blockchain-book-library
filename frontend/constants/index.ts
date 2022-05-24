
  export interface Networks {
    [key: number]: string;
  }
  export const walletConnectSupportedNetworks: Networks = {
    // Add your network rpc URL here
    1: "https://ethereumnode.defiterm.io",
    3: "https://ethereumnode.defiterm-dev.net"
  };

  // Network chain ids
  export const supportedMetamaskNetworks = [1, 3, 4, 5, 42];

  // Addresses of deployed contracts
  export const ELECTION_ADDRESS= "0x95b6D83bD618f5D6873201A2F30F111e8D319546";
  export const BOOK_LIBRARY_ADDRESS= "0xe1CF3CFdaeE67Cfbc4f3E4898a4B832EE425427F";