// https://solanacookbook.com/references/keypairs-and-wallets.html#how-to-verify-a-keypair
import { Keypair, PublicKey } from "@solana/web3.js";
import * as bs58 from "bs58";
import * as bip39 from "bip39";
import nacl from "tweetnacl";
import { decodeUTF8 } from "tweetnacl-util";


// GENERATE KEYPAIR
// If connecting to a wallet, not required
// If not connecting to a wallet, a keypair will be required
async function generateKeypair() {
  let keypair = Keypair.generate();
  console.log(keypair);
}

// GENERATE KEYPAIR (From Secret Key)
// A Keypair can be retrieved from a secret
async function generateKeypairFromSecret() {
  const keypair = Keypair.fromSecretKey(
    Uint8Array.from([
      174, 47, 154, 16, 202, 193, 206, 113, 199, 190, 53, 133, 169, 175, 31, 56,
      222, 53, 138, 189, 224, 216, 117, 173, 10, 149, 53, 45, 73, 251, 237, 246,
      15, 185, 186, 82, 177, 240, 148, 69, 241, 227, 167, 80, 141, 89, 240, 121,
      121, 35, 172, 247, 68, 251, 226, 218, 48, 63, 176, 109, 168, 89, 238, 135,
    ]));
    console.log(keypair);
}

// GENERATE KEYPAIR FROM SECRET KEY (With Base String)
// A Keypair can be retrieved from a secret key base string
async function generateKeypairFromSecretString() {
  const keypair = Keypair.fromSecretKey(
    bs58.decode(
      "5MaiiCavjCmn9Hs1o3eznqDEhRwxo7pXiAYez7keQUviUkauRiTMD8DrESdrNjN8zd9mTmVhRvBJeg5vhyvgrAhG"
    )
  );
    console.log(keypair);
}

// VERIFY KEYPAIR (Secret Key vs Public Key)
// Verify if secret key matches public key
async function verifySecretVsPublic() {
  const publicKey = new PublicKey("24PNhTaNtomHhoy3fTRaMhAFCRj4uHqhZEEoWrKDbR5p");
  const keypair = Keypair.fromSecretKey(
    Uint8Array.from([
      174, 47, 154, 16, 202, 193, 206, 113, 199, 190, 53, 133, 169, 175, 31, 56,
      222, 53, 138, 189, 224, 216, 117, 173, 10, 149, 53, 45, 73, 251, 237, 246,
      15, 185, 186, 82, 177, 240, 148, 69, 241, 227, 167, 80, 141, 89, 240, 121,
      121, 35, 172, 247, 68, 251, 226, 218, 48, 63, 176, 109, 168, 89, 238, 135,
    ])
  );
  console.log(keypair.publicKey.toBase58() === publicKey.toBase58());
}

// VERIFY PUBKEY HAS PRIVATE KEY
// Useful for PDA as should not have a Private Key (as should not be on ed25519 curve)
async function verifyPubkeyHasPrivateKey() {
  const key = new PublicKey("5oNDL3swdJJF1g9DzJiZ4ynHXgszjAEpUkxVYejchzrY");
  console.log(PublicKey.isOnCurve(key.toBytes()));
}

// GENERATE MNEMONIC PHRASE
// For saving as a backup if generating a wallet
async function generateMnemonicPhrase() {
  const mnemonic = bip39.generateMnemonic();
  console.log(mnemonic);
}

// RESTORE KEYPAIR FROM MNEMONIC PHRASE
// For restoring your keypair if have mnemonic
async function restoreKeypairFromMnemonic() {
  const mnemonic = "pill tomorrow foster begin walnut borrow virtual kick shift mutual shoe scatter";
  const seed = bip39.mnemonicToSeedSync(mnemonic, ""); // (mnemonic, password)
  const keypair = Keypair.fromSeed(seed.slice(0, 32));
  console.log(keypair);
}

// GENERATE VANITY ADDRESS KEYPAIR (WARNING: RUN FROM CLI AS SLOW!!!!!!)
// For restoring your keypair if have mnemonic
async function generateVanityAddressKeypir() {
  let keypair = Keypair.generate();
  while (!keypair.publicKey.toBase58().startsWith("shaun")) {
    keypair = Keypair.generate();
  }
  console.log(keypair);
}

// SIGN AND VERIFY MESSAGES WITH WALLETS
// Signature Verification enables debiting and changing of data 
async function signMessage() {
  const keypair = Keypair.generate();
  const message = "The quick brown fox jumps over the lazy dog";
  const messageBytes = decodeUTF8(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  const result = nacl.sign.detached.verify(
    messageBytes,
    signature,
    keypair.publicKey.toBytes()
  );
  console.log(signature, result);
}

// Select function to run
async function main() {
  // generateKeypair();
  // generateKeypairFromSecret();
  // generateKeypairFromSecretString();
  // verifySecretVsPublic();
  // verifyPubkeyHasPrivateKey();
  // generateMnemonicPhrase();
  // restoreKeypairFromMnemonic();
  // // generateVanityAddressKeypir(); // Warning! Very Slow
  signMessage();
}

// Run program
main();