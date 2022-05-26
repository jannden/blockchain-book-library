import Link from "next/link";

function Home() {
  return (
    <>
      <h1>Projects</h1>
      <p>
        <Link href="/election">
          <a>Election</a>
        </Link>
      </p>
      <p>
        <Link href="/book-library">
          <a>Book Library</a>
        </Link>
      </p>
      <p>
        <Link href="/marketplace">
          <a>Marketplace</a>
        </Link>
      </p>
    </>
  );
}

export default Home;
