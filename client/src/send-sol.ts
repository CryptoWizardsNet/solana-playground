import {
  Connection,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

(async () => {
  // Establish Wallet From
  const fromKeypair = Keypair.generate();
  const toKeypair = Keypair.generate();

  // Establish Connection
  const RPC_URL = "http://127.0.0.1:8899";
  const connection = new Connection(RPC_URL, "confirmed");

  // Sign Airdrop Tokens Request
  const airdropSignature = await connection.requestAirdrop(
    fromKeypair.publicKey,
    LAMPORTS_PER_SOL * 2
  );
  await connection.confirmTransaction(airdropSignature);

  // Check Balance
  const balance = await connection.getBalance(fromKeypair.publicKey);

  // Define Lamports to send
  const lamportsToSend = LAMPORTS_PER_SOL * 1;
  
  // Recent Blockhash - Only needed if wanting fee estimate
  const recentBlockhash = await connection.getLatestBlockhash();
  const requiredObjIfFeesWantedOnly = {
    feePayer: fromKeypair.publicKey,
    recentBlockhash: recentBlockhash.blockhash,
  }

  const transferTransaction = new Transaction(requiredObjIfFeesWantedOnly).add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toKeypair.publicKey,
      lamports: lamportsToSend,
    })
  );

  // Get Estimated Fees
  const fees = await transferTransaction.getEstimatedFee(connection);
  console.log(`Estimated Transaction Cost: ${fees / LAMPORTS_PER_SOL} SOL`);
  
  // Send Transaction
  const receipt = await sendAndConfirmTransaction(connection, transferTransaction, [
    fromKeypair,
  ]);

  // Check Balance Movement
  const balance_new = await connection.getBalance(fromKeypair.publicKey);
  console.log("Starting Balance (SOL): ", balance / LAMPORTS_PER_SOL);
  console.log("New Balance (SOL): ", balance_new / LAMPORTS_PER_SOL);

  // Show Instrcuction Result
  console.log("TX Receipt: ", receipt);
})();
