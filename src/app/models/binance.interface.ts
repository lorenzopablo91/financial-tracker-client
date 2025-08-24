export interface AccountInfo {
  balances: Balance[];
}

export interface Balance {
  asset: string;
  free: string;
  locked: string;
}

export interface CryptoPrice {
  symbol: string;
  price: string;
}

export interface CryptoData {
  name: string;
  symbol: string;
  amount: number;
  priceUSD: number;
  valueUSD: number;
  color: string;
}