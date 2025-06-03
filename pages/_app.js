// pages/_app.js
import "../styles/globals.css";
import dynamic from "next/dynamic";

// Dynamically import Providers so it only runs on client side (ssr: false)
const Providers = dynamic(() => import("../components/Providers"), { ssr: false });

function MyApp({ Component, pageProps }) {
  return (
    // On the server, Providers is not rendered. On the client, it wraps children.
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}

export default MyApp;
