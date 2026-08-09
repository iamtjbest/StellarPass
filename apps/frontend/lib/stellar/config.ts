const contractId = process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ID;

console.log("RAW ENV CONTRACT ID:", contractId);

export const STELLAR_NETWORK =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";

export const STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL ||
  "https://soroban-testnet.stellar.org";

export const STELLAR_NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
  "Test SDF Network ; September 2015";

export const STELLAR_CONTRACT_ID = contractId || "";

console.log("STELLAR CONFIG:", {
  network: STELLAR_NETWORK,
  rpc: STELLAR_RPC_URL,
  contractId: STELLAR_CONTRACT_ID,
});