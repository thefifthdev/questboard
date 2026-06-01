// Public configuration. All values are safe to expose in the browser bundle.
// Defaults point at the live testnet deployment so the app works out of the box.

export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID ?? 'CBKESO2WG5QWS2GJN7CBUCUQA7JGWGI3YG3BUAPUKAPLMWWSHPNAEBFY';

export const NETWORK = process.env.NEXT_PUBLIC_NETWORK ?? 'testnet';

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://soroban-testnet.stellar.org';

export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

// Default reward token: the native XLM Stellar Asset Contract on testnet.
export const DEFAULT_TOKEN =
  process.env.NEXT_PUBLIC_TOKEN ?? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const EXPLORER_TX = (hash: string) =>
  `https://stellar.expert/explorer/${NETWORK}/tx/${hash}`;

export const EXPLORER_CONTRACT = `https://stellar.expert/explorer/${NETWORK}/contract/${CONTRACT_ID}`;
