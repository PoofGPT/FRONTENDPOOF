// pages/_app.js
import "../styles/globals.css";

// Solana wallet adapter imports
import { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

// Default styles that your app can override
require("@solana/wallet-adapter-react-ui/styles.css");

const MyApp: FC<{ Component: any; pageProps: any }> = ({ Component, pageProps }) => {
  // You can set the cluster/network here (mainnet-beta, devnet, testnet)
  const network = WalletAdapterNetwork.Mainnet;

  // You may want to fetch this from your environment (.env)
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com";

  // Configure the wallets you want to support
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default MyApp;
