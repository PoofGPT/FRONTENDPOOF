// pages/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useWallet, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet as useWalletHook } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ROUTER_ID, Jupiter } from "@jup-ag/core"; // Jupiter client

export default function Home() {
  const router = useRouter();
  const { input, output, amount } = router.query;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only call useWallet once mounted
  const { publicKey, connected, sendTransaction } = mounted
    ? useWalletHook()
    : { publicKey: null, connected: false, sendTransaction: null };

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState("");

  // Validate query params
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

  // Mainnet endpoint
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com";
  const connection = new Connection(endpoint);

  // Handle the on‐chain swap
  const doSwap = async () => {
    try {
      if (!connected || !publicKey) {
        setErrorMsg("🦄 Please connect your wallet first.");
        return;
      }
      setLoading(true);
      setErrorMsg("");
      setTxSignature("");

      // 1) Prepare mints and amountRaw
      const inputMintPub = new PublicKey(input);
      const outputMintPub = new PublicKey(output);

      // Convert human‐readable SOL (e.g. "3") to lamports if input is wrapped SOL
      // If input is an SPL token, adjust decimals accordingly (not shown here).
      const amountNumber = Number(amount);
      const amountRaw = Math.round(amountNumber * LAMPORTS_PER_SOL).toString();

      // 2) Initialize Jupiter
      const jupiter = await Jupiter.load({
        connection,
        cluster: "mainnet-beta",
        user: publicKey,
      });

      // 3) Find routes (0.5% slippage tolerance)
      const routes = await jupiter.computeRoutes({
        inputMint: inputMintPub.toString(),
        outputMint: outputMintPub.toString(),
        amount: amountRaw,
        slippageBps: 50, // 0.5%
      });
      if (!routes || routes.routesInfos.length === 0) {
        setErrorMsg("😵‍💫 No route found—try a different pair or amount.");
        setLoading(false);
        return;
      }

      // Pick the best route (first one)
      const bestRoute = routes.routesInfos[0];

      // 4) Build the swap transaction
      const { swapTransaction } = await jupiter.exchange({
        routeInfo: bestRoute,
      });

      // 5) Send & confirm
      const signature = await sendTransaction(swapTransaction, connection);
      await connection.confirmTransaction(signature, "confirmed");
      setTxSignature(signature);
    } catch (err) {
      console.error(err);
      setErrorMsg("😵‍💫 Swap failed—try again?");
    } finally {
      setLoading(false);
    }
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

          {/* Only render the connect button client-side */}
          {mounted && <WalletMultiButton className="btn-primary" />}

          {/* Show “Swap Now” button when wallet connected */}
          {mounted && connected && (
            <div className="swap-link">
              <button
                className="btn-primary"
                onClick={doSwap}
                disabled={loading}
              >
                {loading ? "…Swapping" : "Swap Now"}
              </button>
            </div>
          )}

          {/* Show transaction signature if swap succeeded */}
          {txSignature && (
            <div className="info-box">
              <p>Swap succeeded!</p>
              <p>
                Signature:{" "}
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=mainnet-beta`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {txSignature.slice(0, 8)}…{txSignature.slice(-8)}
                </a>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
