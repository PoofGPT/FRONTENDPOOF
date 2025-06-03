// pages/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
// We import useWallet but will only call it client‐side
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const router = useRouter();
  const { input, output, amount } = router.query;

  // Track if we are running on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only call useWallet() on the client (when mounted === true)
  const { publicKey, connected } = mounted
    ? useWallet()
    : { publicKey: null, connected: false };

  const [errorMsg, setErrorMsg] = useState("");

  // Validate query params once router is ready
  useEffect(() => {
    if (router.isReady) {
      if (!input || !output || !amount) {
        setErrorMsg(
          "Missing URL parameters. Usage: ?input=INPUT_MINT&output=OUTPUT_MINT&amount=AMOUNT"
        );
      } else {
        setErrorMsg("");
      }
    }
  }, [input, output, amount, router.isReady]);

  // Build the Jupiter deep-link
  const getJupiterLink = () => {
    if (!connected || !input || !output || !amount) return "#";
    const params = new URLSearchParams({
      inputMint: input,
      outputMint: output,
      amount,
    });
    return `https://jup.ag/swap?${params.toString()}`;
  };

  return (
    <div className="main-container animated fadeInDown">
      <div className="logo-container">
        <img src="/phantom-logo.svg" alt="Phantom Logo" className="logo" />
        <h1 className="site-title">SolanaGPT Swap</h1>
      </div>

      {errorMsg ? (
        <div className="error-box">{errorMsg}</div>
      ) : (
        <>
          <div className="info-box">
            <p>
              <strong>Input Mint:</strong> {input}
            </p>
            <p>
              <strong>Output Mint:</strong> {output}
            </p>
            <p>
              <strong>Amount:</strong> {amount}
            </p>
          </div>

          {/* 
             WalletMultiButton will only render on the client once 'mounted' is true 
             (because calling useWallet() on the server would throw). 
          */}
          {mounted && <WalletMultiButton className="btn-primary" />}

          {mounted && connected && (
            <div className="swap-link">
              <a
                href={getJupiterLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="btn-primary">Swap in Jupiter</button>
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
