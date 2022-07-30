import {
  Keypair, 
  PublicKey, 
  SystemProgram, 
  Connection, 
  LAMPORTS_PER_SOL, 
  Transaction, 
  sendAndConfirmTransaction } from "@solana/web3.js";

(async () => {
  // Establish Wallet From
  const feePayer = Keypair.generate();
  const authorityWallet = Keypair.generate();
  const someOtherWallet = Keypair.generate();

  // Establish Connection
  const RPC_URL = "http://127.0.0.1:8899";
  const connection = new Connection(RPC_URL, "confirmed");

  // Sign Airdrop Tokens Request
  const airdropSignature = await connection.requestAirdrop(feePayer.publicKey, LAMPORTS_PER_SOL * 3);
  await connection.confirmTransaction(airdropSignature);

  // GENERATE ADDRESS
  // Generate Account Address
  const programId = SystemProgram.programId;
  const seed = "hello";
  const account1 = await PublicKey.createWithSeed(authorityWallet.publicKey, seed, programId);
  const account1Address = account1.toBase58();
  console.log("Account 1 Address Generated: ", account1Address);

  // Check cost (rent exemption amount) for size of data in SOL
  const dataLength = 30;
  const rentExemptionAmount = await connection.getMinimumBalanceForRentExemption(dataLength);
  console.log("Exemption Cost in SOL: ", rentExemptionAmount / LAMPORTS_PER_SOL);

  // CREATE ACCOUNT
  // Build and Send Transaction - Create Account
  const tx = new Transaction().add(
    SystemProgram.createAccountWithSeed({
      fromPubkey: feePayer.publicKey, // Fee payer
      newAccountPubkey: account1, // New Account Address
      basePubkey: authorityWallet.publicKey, // Base Account Authority
      seed: seed,
      lamports: rentExemptionAmount,
      space: dataLength,
      programId: programId,
    })
  );
  await sendAndConfirmTransaction(connection, tx, [feePayer, authorityWallet]);

  // Get Account Info
  const accountInfo = await connection.getAccountInfo(account1);
  console.log("Account 1 Created With Info: \n", accountInfo);

  // Create Another Account
  const seed2 = "rogue1";
  const account2 = await PublicKey.createWithSeed(someOtherWallet.publicKey, seed2, programId);
  const account2Address = account2.toBase58();
  console.log("Account 2 Address Generated: ", account2Address);

  // Check cost (rent exemption amount) for new account for size of data in SOL
  const dataLength2 = 10;
  const rentExemptionAmount2 = await connection.getMinimumBalanceForRentExemption(dataLength2);
  console.log("Exemption Cost in SOL: ", rentExemptionAmount / LAMPORTS_PER_SOL);

  // Build and Send Transaction - Create Account
  const tx2 = new Transaction().add(
    SystemProgram.createAccountWithSeed({
      fromPubkey: feePayer.publicKey, // Fee payer
      newAccountPubkey: account2, // New Account Address
      basePubkey: someOtherWallet.publicKey, // Base Account Authority
      seed: seed2,
      lamports: rentExemptionAmount2 / 2, // under paying to show rent will not be exempt (Rent Epoch)
      space: dataLength2,
      programId: programId,
    })
  );
  await sendAndConfirmTransaction(connection, tx2, [feePayer, someOtherWallet]);

  // Get 2 Account Info
  const accountInfo2 = await connection.getAccountInfo(account2);
  console.log("Account 2 Created With Info: \n", accountInfo2);

  // Fund Wallet for Transfer
  const airdropSignature2 = await connection.requestAirdrop(authorityWallet.publicKey, LAMPORTS_PER_SOL * 1);
  await connection.confirmTransaction(airdropSignature2);

  // TRANSFER ACCOUNT
  // Only Account owned by System Program, can tfer from System Program
  let derived = await PublicKey.createWithSeed(authorityWallet.publicKey, seed2, programId);
  const txTfer = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: derived,
      basePubkey: authorityWallet.publicKey,
      toPubkey: someOtherWallet.publicKey,
      lamports: 0, // or enter in amount of account lamports to tfer
      seed: seed2,
      programId: programId,
    })
  );
  const txHash = await sendAndConfirmTransaction(connection, txTfer, [feePayer, authorityWallet]);
  const tx3 = await connection.getSignatureStatuses([txHash]);
  console.log("Tfer Transaction Overview: \n", tx3.value[0]);
})();