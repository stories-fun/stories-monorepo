"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import CustomButton from "@/components/common/Button";
import TokenSelector from "./TokenSelector";

interface TradeModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function TradeModal({ isOpen, onCloseAction }: TradeModalProps) {
  const [fromAmount, setFromAmount] = useState("0");
  const [fromToken, setFromToken] = useState("So11111111111111111111111111111111111111112"); // SOL
  const [toToken, setToToken] = useState("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC
  const [toAmount, setToAmount] = useState("0");
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  const getQuote = async () => {
    if (!publicKey || !fromAmount) return;

    const amountLamports = Math.floor(Number(fromAmount) * 10 ** 9); // Simplified for SOL
    const url = new URL("https://quote-api.jup.ag/v6/quote");
    url.searchParams.append("inputMint", fromToken);
    url.searchParams.append("outputMint", toToken);
    url.searchParams.append("amount", amountLamports.toString());
    url.searchParams.append("slippage", "0.5");

    const res = await fetch(url.toString());
    const data = await res.json();
    if (data && data.data && data.data.length > 0) {
      setRoute(data.data[0]);
      const uiAmount = data.data[0].outAmount / 10 ** 6; // Simplified for USDC
      setToAmount(uiAmount.toFixed(2));
    }
  };

  const handleSwap = async () => {
    if (!route || !publicKey || !signTransaction || !sendTransaction) return;
    setLoading(true);

    try {
      const response = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route,
          userPublicKey: publicKey.toBase58(),
          wrapUnwrapSOL: true,
          feeAccount: null,
        }),
      });

      const data = await response.json();
      const tx = Transaction.from(Buffer.from(data.swapTransaction, "base64"));
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = publicKey;

      const signed = await signTransaction(tx);
      const sig = await sendTransaction(signed, connection);
      await connection.confirmTransaction(sig, "confirmed");
      console.log("Swap success:", sig);
    } catch (err) {
      console.error("Swap error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getQuote();
  }, [fromAmount, fromToken, toToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#141414]/40 backdrop-blur-sm flex items-center justify-center z-150 px-4">
      <div className="bg-[#141414] rounded-3xl p-6 w-full shadow-2xl relative max-w-[450px]">
        <button onClick={onCloseAction} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>

        <div className="bg-[#FFDE7A] rounded-2xl p-4 mb-1">
          <TokenSelector selectedMint={fromToken} onSelectAction={setFromToken} />
          <input
            type="text"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="text-black bg-transparent text-3xl font-bold text-right outline-none w-full"
            placeholder="0.00"
          />
        </div>

        <div className="flex justify-center -my-1 z-10 relative">
          <button
            onClick={() => {
              const temp = fromToken;
              setFromToken(toToken);
              setToToken(temp);
              setFromAmount("0");
              setToAmount("0");
              setRoute(null);
            }}
            className="bg-[#141414] border-4 border-[#FFDE7A] rounded-full p-3"
          >
            <ArrowUpDown className="text-[#FFDE7A]" size={20} />
          </button>
        </div>

        <div className="bg-[#FFDE7A] rounded-2xl p-4 mb-7">
          <TokenSelector selectedMint={toToken} onSelectAction={setToToken} />
          <div className="text-black text-3xl font-bold text-right">{toAmount}</div>
        </div>

        <CustomButton
          text={loading ? "Swapping..." : "Swap"}
          className="w-full py-4 text-lg"
          onClick={handleSwap}
          disabled={loading}
        />
      </div>
    </div>
  );
}