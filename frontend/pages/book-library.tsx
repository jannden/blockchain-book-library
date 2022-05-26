import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import useBookLibraryContract from "../hooks/useBookLibraryContract";
import { formatEtherscanLink, shortenHex } from "../utils/util";
import { deployedBookLibrary } from "../utils/deployedContracts";

type PropsType = {
  contractAddress: string;
};
type AvailableBooks = {
  id: BigNumber;
  book: string;
};
type InfoType = {
  error?: string;
  info?: string;
  link?: string;
  hash?: string;
};

const BookLibrary = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [info, setInfo] = useState<InfoType>({});
  const [availableBooks, setAvailableBooks] = useState<AvailableBooks[]>([]);
  const [allBorrowers, setAllBorrowers] = useState<string[]>([]);
  const [bookName, setBookName] = useState<string | undefined>();
  const [bookCopies, setBookCopies] = useState<number | undefined>();
  const [bookId, setBookId] = useState<number | undefined>();

  const bookLibraryContract = useBookLibraryContract(deployedBookLibrary.address);
  const { chainId } = useWeb3React<Web3Provider>();

  useEffect(() => {
    if (bookLibraryContract) {
      getAvailableBooks();
    }
  }, [bookLibraryContract]);

  const getAvailableBooks = async () => {
    const result = await bookLibraryContract.getAvailableBooks();
    setAvailableBooks(result);
  };

  const bookNameHandler = (e) => setBookName(e.target.value);
  const bookCopiesHandler = (e) => setBookCopies(e.target.value);
  const bookIdHandler = (e) => {
    setBookId(e.target.value);
    setAllBorrowers([]);
  };
  const addBook = async () => {
    setLoading(true);
    try {
      const tx = await bookLibraryContract.addBook(bookName, bookCopies);
      setInfo({
        info: "Transaction pending...",
        link: formatEtherscanLink("Transaction", [tx.chainId || chainId, tx.hash]),
        hash: shortenHex(tx.hash),
      });
      const receipt = await tx.wait();
      setInfo({
        info: "Transaction completed.",
      });
      getAvailableBooks();
    } catch (error) {
      // Solidity errors returned by required statements have the syntax error.error.message
      setInfo({ error: error.error?.message || error.errorArgs[0] || error.message });
      console.log(error.error?.message);
    } finally {
      setLoading(false);
    }
  };
  const borrowBook = async () => {
    setLoading(true);
    try {
      const tx = await bookLibraryContract.borrowBook(bookId);
      setInfo({
        info: "Transaction pending...",
        link: formatEtherscanLink("Transaction", [tx.chainId || chainId, tx.hash]),
        hash: shortenHex(tx.hash),
      });
      const receipt = await tx.wait();
      setInfo({
        info: "Transaction completed.",
      });
      getAvailableBooks();
    } catch (error) {
      // Solidity errors returned by required statements have the syntax error.error.message
      setInfo({ error: error.error?.message || error.errorArgs[0] || error.message });
      console.log(error.error?.message);
    } finally {
      setLoading(false);
    }
  };
  const returnBook = async () => {
    setLoading(true);
    try {
      const tx = await bookLibraryContract.returnBook(bookId);
      setInfo({
        info: "Transaction pending...",
        link: formatEtherscanLink("Transaction", [tx.chainId || chainId, tx.hash]),
        hash: shortenHex(tx.hash),
      });
      const receipt = await tx.wait();
      setInfo({
        info: "Transaction completed.",
      });
      getAvailableBooks();
    } catch (error) {
      // Solidity errors returned by required statements have the syntax error.error.message
      setInfo({ error: error.error?.message || error.errorArgs[0] || error.message });
      console.log(error.error?.message);
    } finally {
      setLoading(false);
    }
  };
  const getAllBorrowers = async () => {
    try {
      setInfo({});
      const result = await bookLibraryContract.getAllBorrowers(bookId);
      setAllBorrowers(result);
    } catch (error) {
      // Solidity errors returned by required statements have the syntax error.error.message
      setInfo({ error: error.error?.message || error.errorArgs[0] || error.message });
      console.log(error.error?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Book Library</h1>
      <div>
        {info.info && <div className="info">{info.info}</div>}
        {info.link && info.hash && (
          <div>
            <a href={info.link}>{info.hash}</a>
          </div>
        )}
        {info.error && <div className="error">{info.error}</div>}
        <div>
          <h4>Adding a book</h4>
          <label>
            Book name:
            <input disabled={loading} onChange={bookNameHandler} value={bookName} type="text" />
          </label>
          <br />
          <label>
            Book copies:
            <input
              disabled={loading}
              onChange={bookCopiesHandler}
              value={bookCopies}
              type="number"
            />
          </label>
          <br />
          <button disabled={loading} onClick={addBook}>
            Add book
          </button>
        </div>
        <div>
          <h4>Interacting with a book</h4>
          <label>
            Book id:
            <input disabled={loading} onChange={bookIdHandler} value={bookId} type="number" />
          </label>
          <button disabled={loading} onClick={borrowBook}>
            Borrow book
          </button>
          <button disabled={loading} onClick={returnBook}>
            Return book
          </button>
          <button disabled={loading} onClick={getAllBorrowers}>
            Get all borrowers
          </button>
        </div>
        <div>
          <h4>Available Books</h4>
          {availableBooks.length > 0
            ? availableBooks.map((item) => (
                <div className="book" key={item.id.toString()}>
                  {item.book}, id: {item.id.toString()}
                </div>
              ))
            : "No books available"}
        </div>
        {allBorrowers.length > 0 && (
          <div>
            <h4>All borrowers of book id {bookId}</h4>
            {allBorrowers.map((item) => (
              <div key={item}>
                <a
                  {...{
                    href: formatEtherscanLink("Account", [chainId, item]),
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }}
                >
                  {shortenHex(item, 4)}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BookLibrary;
