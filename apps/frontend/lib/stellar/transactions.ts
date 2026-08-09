import {
  TransactionBuilder,
  rpc,
  Contract,
  xdr,
  Transaction,
  Account
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { server } from './client';
import { STELLAR_NETWORK_PASSPHRASE, STELLAR_CONTRACT_ID, STELLAR_NETWORK } from './config';

export async function submitContractTx(
  method: string,
  args: xdr.ScVal[],
  publicKey: string,
  onStatus?: (status: string) => void
): Promise<string> {
  const contract = new Contract(STELLAR_CONTRACT_ID);

  onStatus?.("PREPARING");

  // 1. Get the latest account state
  const account = await server.getAccount(publicKey);

  console.log("ACCOUNT SEQUENCE:", account.sequenceNumber());

  // 2. Build transaction
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  console.log("TRANSACTION BEFORE SIMULATION:", tx.toXDR());

  // 3. Simulate
  onStatus?.("SIMULATING");

  const simulated = await server.simulateTransaction(tx);

  console.log("SIMULATION RESULT:", simulated);

  if (rpc.Api.isSimulationError(simulated)) {
    const simulationError = String(simulated.error);

    console.error("SIMULATION ERROR:", simulationError);

    if (
      method === "check_in" &&
      simulationError.includes("Error(Contract, #3)")
    ) {
      throw new Error(
        "You are not authorized to perform this check-in."
      );
    }

    throw new Error(`Simulation failed: ${simulationError}`);
  }

  // 4. Assemble using simulation results
  const assembled = rpc
    .assembleTransaction(tx, simulated)
    .build();

  console.log("ASSEMBLED TRANSACTION:", assembled.toXDR());

  // 5. Ask Freighter to sign
  onStatus?.("AWAITING_WALLET");

  let signedTxXdr: string;

  try {
    const result = await signTransaction(
      assembled.toXDR(),
      {
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      }
    );

    console.log("FREIGHTER RESULT:", result);

    if (typeof result === "object" && result !== null && "error" in result) {
      throw new Error(String((result as any).error));
    }

    signedTxXdr =
      typeof result === "string"
        ? result
        : (result as any).signedTxXdr ||
          (result as any).signedTransaction;

    if (!signedTxXdr) {
      throw new Error("Freighter did not return signed transaction XDR");
    }
  } catch (err: any) {
    console.error("FREIGHTER ERROR:", err);
    throw new Error(
      "Wallet signing failed: " +
      (err?.message || JSON.stringify(err))
    );
  }

  // 6. Submit signed transaction
  onStatus?.("SUBMITTING");

  const signedTx = TransactionBuilder.fromXDR(
    signedTxXdr,
    STELLAR_NETWORK_PASSPHRASE
  ) as Transaction;

  console.log("SIGNED TRANSACTION:", signedTx.toXDR());

  const response = await server.sendTransaction(signedTx);

  console.log("SUBMISSION RESPONSE:", response);

  if (response.status === "ERROR") {
    console.error("TRANSACTION ERROR RESULT:", response.errorResult);

    const rawError =
      (response as any).errorResultXdr ||
      JSON.stringify(response.errorResult);

    // Human-readable authorization error
    if (rawError.includes("txBadAuth")) {
      throw new Error(
        "You are not authorized to perform this check-in."
      );
    }

    throw new Error(`Transaction submission failed: ${rawError}`);
  }

  onStatus?.("PENDING");

  // 7. Wait for confirmation
  const hash = response.hash;

  for (let i = 0; i < 20; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const result = await server.getTransaction(hash);

    if (result.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
      continue;
    }

    if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      onStatus?.("CONFIRMED");
      return hash;
    }

    onStatus?.("FAILED");

    throw new Error(
      `Transaction failed on-chain: ${
        (result as any).resultXdr || result.status
      }`
    );
  }

  throw new Error("Transaction timed out waiting for confirmation.");
}

export async function simulateContractRead(
  method: string,
  args: xdr.ScVal[]
): Promise<xdr.ScVal> {
  const contract = new Contract(STELLAR_CONTRACT_ID);

  // Valid Stellar account used only as the simulation source.
  // It does NOT sign or submit anything.
  const source = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

  // Stellar SDK requires a real Account object.
  const account = new Account(source, "0");

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  console.log("READ SIMULATION TX:", tx.toXDR());

  const simulated = await server.simulateTransaction(tx);

  console.log("READ SIMULATION RESULT:", simulated);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  if (rpc.Api.isSimulationSuccess(simulated) && simulated.result) {
    return simulated.result.retval;
  }

  throw new Error("Read query returned no result");
}
