import * as dotenv from "dotenv";

import { BigNumber, Contract } from "ethers";
import hre, { ethers } from "hardhat";

dotenv.config();

const rinkebyContractAddress = "0x7971152A3F2FeF46C4c15EBB963861828a6b5EE1";

interface AvailableBook {
  id: BigNumber;
  book: string;
}

const formatAvailableBooks = (books: Array<AvailableBook>): string[] => {
  return books.map((item) => item.book);
};

/*
const aliceWallet = new hre.ethers.Wallet("alicePrivateKey", provider)
const aliceContractInstance = new hre.ethers.Contract(contractAddress, Contract.abi, aliceWallet)

const bobsWallet = new hre.ethers.Wallet("bobsPrivateKey", provider)
const bobsContractInstance = await aliceContractInstance.connect(bobsWallet)
*/

async function interact() {
  // Setup wallet and provider
  /*
  // This is the difficult way
  let alicesWallet: Wallet;
  let bobsWallet: Wallet;
  if (hre.hardhatArguments.network === "rinkeby") {
    // Wallet instance rinkeby
    const provider = new ethers.providers.InfuraProvider(
      "rinkeby",
      process.env.INFURA
    );
    alicesWallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
    bobsWallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
  } else {
    //Wallet instance localhost
    const provider = new ethers.providers.JsonRpcProvider(
      "http://localhost:8545"
    );
    alicesWallet = new ethers.Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      provider
    );
    bobsWallet = new ethers.Wallet(
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      provider
    );
  }
  */

  // The wallets could be simply taken from ethers:
  const [alicesWallet, bobsWallet] = await ethers.getSigners();
  console.log(
    "Alice's balance is",
    ethers.utils.formatEther(await alicesWallet.getBalance())
  );
  console.log(
    "Bob's balance is",
    ethers.utils.formatEther(await bobsWallet.getBalance())
  );

  // Contract
  let bookLibrary: Contract;
  if (hre.hardhatArguments.network === "rinkeby") {
    const BookLibrary = await ethers.getContractFactory("BookLibrary");
    bookLibrary = await BookLibrary.attach(rinkebyContractAddress);
  } else {
    // Redeploy to clean state
    const BookLibrary = await ethers.getContractFactory("BookLibrary");
    bookLibrary = await BookLibrary.deploy();
  }
  console.log("Contract address is", bookLibrary.address);

  // Prepare variable for available books and desirable book
  let availableBooks: Array<AvailableBook>;
  const desiredBookIndex = 0;

  // Add books to the library
  console.log("Adding Books");

  const addBook = await bookLibrary.connect(alicesWallet).addBook("Hey", 1);
  await addBook.wait();

  // Update available books
  availableBooks = await bookLibrary.getAvailableBooks();
  console.log("Available books are", formatAvailableBooks(availableBooks));

  // If there are no available books, it's an error
  if (!availableBooks.length) {
    console.error("Adding books failed!");
  }

  // Person 1 borrows the desired book
  console.log("Person 1 borrows.");
  const borrowBook = await bookLibrary
    .connect(alicesWallet)
    .borrowBook(desiredBookIndex);
  await borrowBook.wait();

  // Update available books
  availableBooks = await bookLibrary.getAvailableBooks();
  console.log("Available books are", formatAvailableBooks(availableBooks));

  // Person 1 returns the desired book
  console.log("Person 1 returns.");
  const returnBook = await bookLibrary
    .connect(alicesWallet)
    .returnBook(desiredBookIndex);
  await returnBook.wait();

  // Update available books
  availableBooks = await bookLibrary.getAvailableBooks();
  console.log("Available books are", formatAvailableBooks(availableBooks));

  // Person 2 borrows the desired book
  console.log("Person 2 borrows.");
  const borrowBookAgain = await bookLibrary
    .connect(bobsWallet)
    .borrowBook(desiredBookIndex);
  await borrowBookAgain.wait();

  // Update available books
  const allBorrowers = await bookLibrary.getAllBorrowers(desiredBookIndex);
  console.log("All borrowers are", allBorrowers);
}

interact().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = interact;
