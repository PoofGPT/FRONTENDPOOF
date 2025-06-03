// pages/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useWallet, WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const router = useRouter();
  const { input, output, amount } = router.query;

  const { publicKey, connected } = useWallet();
  const [errorMsg, setErrorMsg] = useState("");

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
      {/* Logo + Title */}
      <div className="logo-container">
        <img src="/phantom-logo.svg" alt="Phantom Logo" className="logo" />
        <h1 className="site-title">SolanaGPT Swap</h1>
      </div>

      {errorMsg ? (
        <div className="error-box">{errorMsg}</div>
      ) : (
        <>
          {/* Display swap details */}
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

          {/* WalletMultiButton auto-handles “Connect” / “Disconnect” */}
          <WalletMultiButton className="btn-primary" />

          {/* If connected, show the Swap in Jupiter button */}
          {connected && (
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
