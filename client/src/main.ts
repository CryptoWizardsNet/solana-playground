import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import path from 'path';
import { serialize, deserialize, deserializeUnchecked } from "borsh";
import {getPayer, getRpcUrl, createKeypairFromFile} from './utils';


/**
    CONNECTION AND PAYER ////////////////////////////////////////////////
**/


// Connection
const RPC_URL = "http://127.0.0.1:8899";
const connection = new Connection(RPC_URL, "confirmed");

// Get Main Account
let account_1_wallet: Keypair;
async function connectPayer() {
  account_1_wallet = await getPayer();
};


/**
    PROGRAM ID //////////////////////////////////////////////////////////
**/


// Define Program Id
let programId: PublicKey;
async function getProgramPublicKey(): Promise<void> {
  const PROGRAM_PATH = path.resolve(__dirname, '../../program/target/deploy/');
  const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'solana_program_2-keypair.json');
  const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
  programId = programKeypair.publicKey;
}


/**
    ACCOUNT AND INSTRUCTION SCHEMA //////////////////////////////////////////////////
**/


// ACCOUNT CLASS
class Account {
  counter = 0;
  constructor(fields: {counter: number} | undefined = undefined) {
    if (fields) {
      this.counter = fields.counter;
    }
  }
}

// INSTRUCTION SCHEMA
const AccountSchema = new Map([
  [Account, {kind: 'struct', fields: [['counter', 'u8']]}],
]);

// ACCOUNT DATA
const account_data = serialize(
  AccountSchema,
  new Account(),
);


// INSTRUCTION CLASS
class Instruction {
  tag = 2;
  some_data = 10;
  constructor(fields: {tag: number, some_data: number} | undefined = undefined) {
    if (fields) {
      this.tag = fields.tag;
      this.some_data = fields.some_data;
    }
  }
}

// INSTRUCTION SCHEMA
const InstructionSchema = new Map([
  [Instruction, {kind: 'struct', fields: [['tag', 'u8'], ['some_data', 'u8']]}],
]);

// INSTRUCTION BUFFER BYTE ARRAY
const instruction_data = Buffer.from(serialize(
  InstructionSchema,
  new Instruction(),
));

// INSTRUCTION CHECK
// const instruction_data = Buffer.from(new Uint8Array([0, 10]));
console.log("Serialized Instruction: ", instruction_data);


/**
    ACCOUNT MANAGEMENT //////////////////////////////////////////////////
**/


// Structure and Add Accounts to Solana
let account_2_wallet = Keypair.generate();
let accountPubkey: PublicKey;
let account2Pubkey: PublicKey;
async function accountManagement(): Promise<void> {

  // Airdrop Sol to Account 2
  const airdropSignature = await connection.requestAirdrop(account_2_wallet.publicKey, LAMPORTS_PER_SOL * 1);
  await connection.confirmTransaction(airdropSignature);

  // Note, if this is rejected, it might be because you need to remove the key's saved
  const arr1Length = account_data.length; // Number of bytes in Account1

  // Generate Account 1
  const KEY_SEED = "my test key seed";
  accountPubkey = await PublicKey.createWithSeed(
    account_1_wallet.publicKey,
    KEY_SEED,
    programId,
  );

  // Check if account already exists and create account if not
  const account1 = await connection.getAccountInfo(accountPubkey);
  if (account1 === null) {

    // Check Lamports required for creating account
    let lamports = await connection.getMinimumBalanceForRentExemption(arr1Length);

    // Build Transaction to Create Account
    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: account_1_wallet.publicKey,
        basePubkey: account_1_wallet.publicKey,
        seed: KEY_SEED,
        newAccountPubkey: accountPubkey,
        lamports,
        space: arr1Length,
        programId,
      }),
    );

    // Send Transaction for Creating Account
    await sendAndConfirmTransaction(connection, transaction, [account_1_wallet]);
  }

  // Generate Account 2
  // This time with Zero lamports
  const KEY_SEED_2 = "my test key seed 2";
  account2Pubkey = await PublicKey.createWithSeed(
    account_2_wallet.publicKey,
    KEY_SEED_2,
    programId,
  );

  // Check if account already exists and create account if not
  const account2 = await connection.getAccountInfo(account2Pubkey);
  if (account2 === null) {

    // Check Lamports required for creating account
    let minLamports = await connection.getMinimumBalanceForRentExemption(arr1Length);
    const lamports2 = LAMPORTS_PER_SOL - minLamports;
    console.log("Min Lamports: ", minLamports);

    // Build Transaction to Create Account
    const transaction_2 = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: account_2_wallet.publicKey,
        basePubkey: account_2_wallet.publicKey,
        seed: KEY_SEED_2,
        newAccountPubkey: account2Pubkey,
        lamports: lamports2,
        space: arr1Length,
        programId,
      }),
    );

    // Send Transaction for Creating Account
    await sendAndConfirmTransaction(connection, transaction_2, [account_2_wallet]);
  }
}


/**
    CALL PROGRAM //////////////////////////////////////////////////
**/


// Send Instruction
export async function placeCall(): Promise<void> {
  console.log('Account 1: ', accountPubkey.toBase58());
  console.log('Account 2: ', account2Pubkey.toBase58());
  console.log('Wallet 1: ', account_1_wallet.publicKey.toBase58());
  console.log('Wallet 2: ', account_2_wallet.publicKey.toBase58());
  console.log('Program Id: ', programId.toBase58());

  // Send Instruction
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: accountPubkey, isSigner: false, isWritable: true},
      {pubkey: account2Pubkey, isSigner: false, isWritable: true}
    ],
    programId,
    data: instruction_data,
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [account_1_wallet],
  );
}

// View Results
export async function reportResults(): Promise<void> {
  const accountInfo = await connection.getAccountInfo(accountPubkey);
  const accountInfo2 = await connection.getAccountInfo(account2Pubkey);
  if (accountInfo === null || accountInfo2 === null) {
    throw "Error: cannot find the greeted account";
  }

  // // Convert to number
  // const view = new Int8Array(accountInfo.data);
  // console.log(view);

  // Convert to schema
  const account = deserialize(
    AccountSchema,
    Account,
    accountInfo.data,
  );

  // Output new account result
  console.log("Lamports Account: 1", accountInfo.lamports)
  console.log("Lamports Account: 2", accountInfo2.lamports)
  console.log("Account Updated to: ", account);
}

// Main Function Calls
async function main() {
  await connectPayer();
  await getProgramPublicKey();
  await accountManagement();
  await placeCall();
  await reportResults();
}

// Call Main
main();
