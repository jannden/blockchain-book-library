import Header from "../components/Header";
import Main from "../components/Main";
import { BOOK_LIBRARY_ADDRESS  } from "../constants";
import BookLibrary from "../components/BookLibrary";

function Home() {
  return (
    <div>
      <Header />

      <Main>
        <BookLibrary contractAddress={BOOK_LIBRARY_ADDRESS} />
      </Main>
    </div>
  );
}

export default Home;
