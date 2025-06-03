// pages/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  useWallet,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { computeParamsAndSwapTransaction } from "@jup-ag/api"; 
// Note: If computeParamsAndSwapTransaction is not in @jup-ag/api for your version,
// use the appropriate function to get route + transaction from Jupiter’s docs.

export default function Home() {
  const router = useRouter();
  const { input, output, amount } = router.query;

  const { publicKey, connected, sendTransaction } = useWallet();
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState("");

  // Use either a dedicated RPC or mainnet-beta default
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com"
  );

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

  const doSwap = async () => {
    try {
      if (!connected || !publicKey) throw new WalletNotConnectedError();

      setLoading(true);
      setErrorMsg("");
      setTxSignature("");

      // 1) Prepare parameters for Jupiter
      const inputMint = new PublicKey(input);
      const outputMint = new PublicKey(output);

      // Jupiter expects the amount in the smallest unit (for SOL, it's lamports)
      // If you want to swap N SOL (where N is in decimals), multiply by LAMPORTS_PER_SOL:
      // For example, amount = "3" → 3 * 1e9 = 3000000000 lamports
      // If inputMint=So111… (wrapped SOL), you must convert 3 → 3000000000
      const amountRaw = Math.round(Number(amount) * 1e9);

      // 2) Call Jupiter’s API helper to get route + transaction
      //    `computeParamsAndSwapTransaction` will give you a Transaction object ready to sign.
      const { 
        swapTransaction, // a Transaction object you can send
        // Alternatively, newer versions return { swapTransaction, ... } or instructions + signers
      } = await computeParamsAndSwapTransaction({
        connection,
        routeMap: [], // you can omit or leave empty if you use their default fetchRoutes logic
        inputMint: inputMint.toString(),
        outputMint: outputMint.toString(),
        amount: amountRaw.toString(),
        // feeAccount: optional fee account if you have one
        slippageBps: 50, // e.g. 50 = 0.5% slippage tolerance
        // userPublicKey: publicKey.toString(),
        // wrapUnwrapSOLMint: So11111111111111111111111111111111111111112
      });

      // 3) Send the transaction through the connected wallet adapter
      const signature = await sendTransaction(swapTransaction, connection);
      await connection.confirmTransaction(signature, "confirmed");
      setTxSignature(signature);
    } catch (err) {
      console.error(err);
      if (err.message.includes("WalletNotConnectedError")) {
        setErrorMsg("🦄 Please connect your wallet first.");
      } else {
        setErrorMsg("😵‍💫 Swap failed – try again?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container animated fadeInDown">
      <div className="logo-container">
        <img
          src="/phantom-logo.svg"
          alt="Phantom Logo"
          className="logo"
        />
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

          {/* Shows “Connect Wallet” or the truncated public key once connected */}
          <WalletMultiButton className="btn-primary" />

          {/* If wallet is connected, allow on‐chain swap */}
          {connected && (
            <div className="swap-link">
              <button
                onClick={doSwap}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "…Swapping" : "Swap Now"}
              </button>
            </div>
          )}

          {/* Show transaction signature on success */}
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
