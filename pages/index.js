import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const { input, output, amount } = router.query;

  const [walletConnected, setWalletConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
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

  const connectPhantom = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const resp = await window.solana.connect();
        setWalletConnected(true);
        setPublicKey(resp.publicKey.toString());
      } catch (err) {
        setErrorMsg("Phantom connection failed.");
      }
    } else {
      setErrorMsg("Phantom wallet not found.");
    }
  };

  const getJupiterLink = () => {
    if (!walletConnected || !input || !output || !amount) return "";
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

          <button
            className="btn-primary"
            disabled={walletConnected}
            onClick={connectPhantom}
          >
            {walletConnected
              ? `Connected: ${publicKey.slice(0, 6)}...`
              : "Connect Phantom"}
          </button>

          {walletConnected && (
            <div className="swap-link">
              <a href={getJupiterLink()} target="_blank" rel="noopener noreferrer">
                <button className="btn-primary">Swap in Jupiter</button>
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
