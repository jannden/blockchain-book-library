import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const books = [
  { title: "The Witcher", copies: 1 },
  { title: "Harry Potter", copies: 1 },
  { title: "Hercule Poirot", copies: 1 },
];

// const jsNumber = (bigNumber: number) => Number(bigNumber.toString());

interface AvailableBook {
  id: BigNumber;
  name: string;
}

describe("BookLibraryV2", function () {
  let bookLibrary: Contract;
  let accounts: Array<SignerWithAddress>;

  before(async function () {
    accounts = await ethers.getSigners();
    const BookLibrary = await ethers.getContractFactory("BookLibraryV2");
    bookLibrary = await BookLibrary.deploy();
    await bookLibrary.deployed();
  });

  it("Should add a book", async function () {
    const addBook0 = await bookLibrary.addBook(books[0].title, books[0].copies);
    await addBook0.wait();
    const addBook1 = await bookLibrary.addBook(books[1].title, books[1].copies);
    await addBook1.wait();
    const addBook2 = await bookLibrary.addBook(books[2].title, books[2].copies);
    await addBook2.wait();

    const availableBooks = await bookLibrary.getAvailableBooks();
    expect(availableBooks.length).to.equal(books.length);
    availableBooks.forEach((item: AvailableBook, index: number) => {
      expect(item.name).to.equal(books[index].title);
    });
  });

  it("Should borrow available book", async function () {
    const borrowingIndex = 0;
    const borrowBook = await bookLibrary
      .connect(accounts[1])
      .borrowBook(borrowingIndex);
    await borrowBook.wait();

    const availableBooks = await bookLibrary.getAvailableBooks();
    expect(availableBooks.length).to.equal(books.length - 1);
    expect(availableBooks.map((item: AvailableBook) => item.name)).to.eql(
      books
        .filter((_, index) => index !== borrowingIndex)
        .map((item) => item.title)
    );
  });

  it("Should not borrow unavailable book", async function () {
    const borrowingIndex = 0;
    await expect(
      bookLibrary.connect(accounts[2]).borrowBook(borrowingIndex)
    ).to.be.revertedWith("No available copies.");
  });

  it("Should add an existing book", async function () {
    const addingIndex = 0;
    const addBook = await bookLibrary.addBook(books[addingIndex].title, 1);
    await addBook.wait();

    const availableBooks = await bookLibrary.getAvailableBooks();
    expect(availableBooks.map((item: AvailableBook) => item.name)).to.eql(
      books.map((item) => item.title)
    );
  });

  it("Should not borrow book twice", async function () {
    const borrowingIndex = 0;
    await expect(
      bookLibrary.connect(accounts[1]).borrowBook(borrowingIndex)
    ).to.be.revertedWith("Please return the book first.");
  });

  it("Should not return book that's not borrowed", async function () {
    const borrowingIndex = 0;
    await expect(
      bookLibrary.connect(accounts[2]).returnBook(borrowingIndex)
    ).to.be.revertedWith("Sender doesn't have this book.");
  });

  it("Should return borrowed book", async function () {
    const borrowingIndex = 0;
    const returnBook = await bookLibrary
      .connect(accounts[1])
      .returnBook(borrowingIndex);
    await returnBook.wait();

    const availableBooks = await bookLibrary.getAvailableBooks();
    expect(availableBooks.map((item: AvailableBook) => item.name)).to.include(
      books[borrowingIndex].title
    );
  });

  it("Should fetch all borrowers for a book", async function () {
    const borrowingIndex = 0;
    const borrowBook = await bookLibrary
      .connect(accounts[2])
      .borrowBook(borrowingIndex);
    await borrowBook.wait();

    const eventFilter = bookLibrary.filters.BookBorrowed(borrowingIndex);
    const events = await bookLibrary.queryFilter(eventFilter);

    expect(
      events
        .map((item) => item.args?.borrower)
        .filter((value, index, self) => self.indexOf(value) === index)
    ).to.eql([accounts[1].address, accounts[2].address]);
  });
});
