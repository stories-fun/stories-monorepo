"use client";

import { MoveUpRight } from "lucide-react";

interface TransactionProps {
  storyTitle: string;
  price: string;
  date: string;
  txns: string;
}

interface TransactionTableProps {
  transactions: TransactionProps[];
}

export const TransactionTable = ({ transactions }: TransactionTableProps) => {
  return (
    <div className="bg-[#2E2E2E] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-4 gap-6 px-6 py-4 text-gray-400 text-sm font-medium border-b border-[#141414]">
        <div>Title</div>
        <div>Price</div>
        <div>Date</div>
        <div>Txns</div>
      </div>
      
      {/* Transaction Rows */}
      <div className="divide-y divide-[#141414]">
        {transactions.map((transaction, index) => (
          <div key={index} className="grid grid-cols-4 gap-6 px-6 py-4 items-center hover:bg-[#353535] transition-colors">
            <div className="text-white font-medium">
              {transaction.storyTitle}
            </div>
            <div className="text-white font-medium">
              {transaction.price}
            </div>
            <div className="text-gray-400">
              {transaction.date}
            </div>
            <div className="flex">
              <a href={transaction.txns} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-[#00A652] rounded-full flex items-center justify-center">
                <MoveUpRight className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};