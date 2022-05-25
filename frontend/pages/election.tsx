import Header from "../components/Header";
import Main from "../components/Main";
import { ELECTION_ADDRESS } from "../utils/util";
import Election from "../components/Election";

function Home() {
  return (
    <div>
      <Header />
      <Main>
        <Election contractAddress={ELECTION_ADDRESS} />
      </Main>
    </div>
  );
}

export default Home;
