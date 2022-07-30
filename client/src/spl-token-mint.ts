import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  transfer,
  mintTo,
  burnChecked,
  getAccount, 
  getMint, 
  TOKEN_PROGRAM_ID, 
  AccountLayout } from '@solana/spl-token';

(async () => {
  // Establish Wallet Payer
  const payer = Keypair.generate();

  // Establish Connection
  const RPC_URL = "http://127.0.0.1:8899";
  const connection = new Connection(RPC_URL, "confirmed");

  // Sign Airdrop Tokens Request
  const airdropSignature = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL * 2);
  await connection.confirmTransaction(airdropSignature);

  // Create Mint and Freeze Authority
  const mintAuthority = Keypair.generate();
  const freezeAuthority = Keypair.generate();

  // MINT FUNGIBLE TOKEN
  const mint = await createMint(
    connection,
    payer,
    mintAuthority.publicKey, // Has authority to sign 
    freezeAuthority.publicKey, // Has authority to freeze 
    9 // Using 9 matches the CLI (this determines token Decimals)
  );

  // Show Token Mint Address
  console.log("Mint Address: ", mint.toBase58());
  
  // Create Account to Hold Token
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  )

  // Show Token Account to Hold Balance
  console.log("Mint Account: ", tokenAccount.address.toBase58());
  console.log("Mint Account Is Frozen: ", tokenAccount.isFrozen);
  
  // Get Token Account Info
  const tokenAccountInfo = await getAccount(connection, tokenAccount.address);
  console.log("Before Minting to Created Mint Account: ", tokenAccountInfo.amount);

  // Mint 100 Tokens
  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    mintAuthority,
    100000000000 // (as decimals for the mint are set to 9)
  )

  // Get How Much The Token Has Minted
  const mintInfo = await getMint(
    connection,
    mint
  )
  
  // Get New Account Info
  const tokenAccountInfoNew = await getAccount(connection, tokenAccount.address);
  console.log("Minted to Created Mint Account: ", tokenAccountInfoNew.amount);

  // Create Another Account to Hold the same minted Token
  let fromWallet = payer;
  let toWallet = mintAuthority; // To sumulate another person
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, toWallet.publicKey);

  // Transfer tokens to Another User
  let fromTokenAccount = tokenAccount;
  await transfer(
      connection,
      fromWallet,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet.publicKey,
      30000000000
  );

  // Burn Tokens
  let burnTxHash = await burnChecked(
    connection, // connection
    payer, // payer of fees
    tokenAccount.address, // token account
    mint, // mint
    payer, // owner signer
    20e9, // amount, if your deciamls is 9, 10^9 for 1 token
    9 // decimals
  );
  
  // Get Token Account Info - For Remaining Amount
  const tokenAccountInfoRemaining = await getAccount(connection, fromTokenAccount.address);
  const toAccountInfo = await getAccount(connection, toTokenAccount.address);
  console.log(`Amount in Account ${fromTokenAccount.address} after tfer and burn: ${tokenAccountInfoRemaining.amount}`);
  console.log(`Amount in Another Persons Account ${toTokenAccount.address} after tfer: ${toAccountInfo.amount}`);

  // Get Mints/Tokens Payer Owns
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    new PublicKey(payer.publicKey),
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );

  // Show Mints/Tokens Owned
  console.log("");
  console.log("Mint Tokens Owned");
  console.log("Mint/Token                                     Balance");
  console.log("------------------------------------------------------------");
  tokenAccounts.value.forEach((e) => {
    const accountInfo = AccountLayout.decode(e.account.data);
    console.log(`${new PublicKey(accountInfo.mint)}   ${accountInfo.amount}`);
  })

})();