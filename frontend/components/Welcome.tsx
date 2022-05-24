import Link from "next/link";

const Welcome = () => {
  
    return (
      <div>
        Welcome!
        <p>
          <Link href="/election">
            <a>Open Election</a>
          </Link>
        </p>
        <p>
          <Link href="/book-library">
            <a>Open BookLibrary</a>
          </Link>
        </p>
      </div>
    );
  
};

export default Welcome;