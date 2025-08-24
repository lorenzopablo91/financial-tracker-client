export interface WalletData {
    dollarQuote: number;
    dollarAmount: {
        dollarsBanked: number;
        dollarCashed: number;
        dollarInvested: number;
    };
    stockMarketAmount: {
        cedearsPesos: number;
        stockMarketPesos: number;
        cashPesos: number;
    };
    dollarUninvested: number;
    stockMarketUninvested: number;
    cryptoUninvested: number;
    contributionLaly: number;
}

export interface Category {
  name: string;
  amount: number;
  color: string;
  percentage: number;
  difference: number;
  percentageGain: number;
}