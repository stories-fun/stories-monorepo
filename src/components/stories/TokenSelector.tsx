"use client";

import { useEffect, useState, useMemo } from "react";

interface Token {
  address: string;
  symbol: string;
  name: string;
  logoURI: string;
  decimals: number;
  rank: number;
}

interface Props {
  selectedMint: string;
  onSelectAction: (mint: string) => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function TokenSelector({ selectedMint, onSelectAction }: Props) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 200);

  useEffect(() => {
    const loadTokens = async () => {
      const res = await fetch("https://token.jup.ag/all");
      const data: Token[] = await res.json();

      const topTokens = data
        .filter((t) => t.rank && t.logoURI)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 150);

      // Ensure selectedMint is included
      const selectedTokens = data.filter((t) => t.address === selectedMint);

      const combined = [...selectedTokens, ...topTokens];

      // Deduplicate by address
      const unique = Array.from(new Map(combined.map((t) => [t.address, t])).values());

      setTokens(unique);
    };

    loadTokens();
  }, [selectedMint]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filtered = useMemo(() => {
    return tokens
      .filter(
        (t) =>
          t.symbol.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          t.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
      .slice(0, 50);
  }, [debouncedSearch, tokens]);

  const selectedToken = tokens.find((t) => t.address === selectedMint);

  return (
    <div className="relative mb-3">
      <button
        className="flex items-center justify-between w-full px-3 py-2 bg-black/10 rounded-xl text-black"
        onClick={() => setOpen(!open)}
      >
        {selectedToken ? (
          <div className="flex items-center gap-2">
            <img src={selectedToken.logoURI} alt={selectedToken.symbol} className="w-5 h-5 rounded-full" />
            {selectedToken.symbol}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        )}
        <span className="ml-auto text-xs">▼</span>
      </button>

      {open && (
        <div className="absolute z-50 bg-white border border-gray-300 w-full max-h-64 overflow-y-auto mt-1 rounded-xl shadow-lg p-2">
          <input
            type="text"
            placeholder="Search token..."
            value={search}
            onChange={handleSearch}
            className="w-full px-2 py-1 mb-2 text-sm bg-white text-black border border-gray-200 rounded"
          />
          {filtered.map((token) => (
            <div
              key={token.address}
              onClick={() => {
                onSelectAction(token.address);
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
            >
              <img src={token.logoURI} alt={token.symbol} className="w-5 h-5 rounded-full" />
              <span className="text-sm">{token.symbol}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}