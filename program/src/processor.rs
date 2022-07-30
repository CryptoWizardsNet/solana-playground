use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint::ProgramResult,
  msg,
  program_error::ProgramError,
  pubkey::Pubkey,
};
use crate::instruction::{Instruction, SomeDataStruct1, SomeDataStruct2};
use crate::state::{Account1};


// PROCESSOR
// Processes logic and incoming Request from the client
pub struct Processor;
impl Processor {

  // Route Incoming Request
  pub fn process(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
  ) -> ProgramResult {

    // Confirm initialization
    msg!("Process starting...");

    // Unpack Instruction
    let instruction = Instruction::unpack(instruction_data)?;
    msg!("Instruction Received: {:?}", &instruction);

    // Route Based on Instruction
    match instruction {
      Instruction::Instruction1 (ix) => {
        msg!("Processing Instruction 1");
        Self::process_instruction_1(program_id, accounts, ix)
      },
      Instruction::Instruction2 (ix) => {
        msg!("Processing Instruction 2");
        Self::process_instruction_2(program_id, accounts, ix)
      },
      Instruction::TransferLamports => {
        msg!("Transferring Lamports");
        Self::transfer_lamports(program_id, accounts)
      }
    }
  }

  // Route: process instruction 1
  fn process_instruction_1(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    ix: SomeDataStruct1,
  ) -> ProgramResult {

    // Extract account(s)
    let account_info_iter = &mut accounts.iter();
    let account_1 = next_account_info(account_info_iter)?;
    msg!("Account: {:?}", account_1);
    let mut account_user = Account1::try_from_slice(&account_1.data.borrow()).unwrap();

    // Ensure Account is owned by the program
    if account_1.owner != program_id {
      msg!("Greeted account does not have the correct program id");
      return Err(ProgramError::IncorrectProgramId);
    }

    // Make Adjustments
    account_user.counter += 1;

    // Submit Account Data Changes
    account_user.serialize(&mut &mut account_1.data.borrow_mut()[..])?;

    // Close Program
    msg!("Complete: Processed instruction 1. User data changed.");
    Ok(())
  }

  // Route: process instruction 2
  fn process_instruction_2(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    ix: SomeDataStruct2,
  ) -> ProgramResult {
    msg!("Complete: Processed instruction 2. Nothing happening here.");
    Ok(())
  }

  // Route: Transfer Lamports
  fn transfer_lamports(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
  ) -> ProgramResult {

    // Create Iterator
    let account_info_iter = &mut accounts.iter();

    // Account 1 Info
    let account_1 = next_account_info(account_info_iter)?;

    // Account 2 Info
    let account_2 = next_account_info(account_info_iter)?;

    // Determine fee - 5 Lamports
    let my_fee = 500000000u64;

    // Ensure enough balance
    if **account_2.try_borrow_lamports()? < my_fee {
      return Err(ProgramError::Custom(5));
    }

    // Debit from_account and credit to_account
    **account_2.try_borrow_mut_lamports()? -= my_fee;
    **account_1.try_borrow_mut_lamports()? += my_fee;

    // Return
    Ok(())
  }
}
