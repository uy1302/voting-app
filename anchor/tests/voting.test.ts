import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Voting } from '../target/types/voting'
import { startAnchor } from 'solana-bankrun'
import { BankrunProvider } from 'anchor-bankrun'
import { access } from 'fs'

const IDL = require("../target/idl/voting.json")

const votingAddress = new PublicKey("E5VCLHNcqe8st2xXqWnVus49zGPTQVkLqqwd4JMjoFFN");

describe('Voting', () => {

  let context;
  let provider;
  anchor.setProvider(anchor.AnchorProvider.env());
  provider = anchor.getProvider();
  let votingProgram = anchor.workspace.Voting as Program<Voting>;

  beforeAll(async() => {
    // context = await startAnchor("", [{ name: "voting", programId: votingAddress }], []);
    // provider = new BankrunProvider(context);
    // votingProgram = new Program<Voting>(IDL, provider);
  })


  it('Initialize Poll', async () => {

  const pollId = new anchor.BN(1);

  const [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [pollId.toArrayLike(Buffer, "le", 8)],
    votingAddress
  );

  await votingProgram.methods.initializePoll(
    pollId,
    "Who is the best Solana developer?",
    new anchor.BN(0),
    new anchor.BN(1756651415),
    new anchor.BN(3),   
  )
  .accounts({
    signer: provider.wallet.publicKey,
    poll: pollPda,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();

  // fetch lại để kiểm tra
  const pollAccount = await votingProgram.account.poll.fetch(pollPda);
  console.log("Poll account:", pollAccount);

  expect(pollAccount.description).toEqual("Who is the best Solana developer?");
  expect(pollAccount.pollStart.toNumber()).toBeLessThan(pollAccount.pollEnd.toNumber());
});

  it("initialize candidate", async() => {
    await votingProgram.methods.initializeCandidate(
      "Saitama Coder",
      new anchor.BN(1),
    ).rpc();
    await votingProgram.methods.initializeCandidate(
      "Khac Vy",
      new anchor.BN(1),
    ).rpc();

    const [SaitamaAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Saitama Coder")],
      votingAddress,
    );

    const SaitamaCandidate = await votingProgram.account.candidate.fetch(SaitamaAddress);
    console.log(SaitamaCandidate);
    expect(SaitamaCandidate.candidateVotes.toNumber()).toEqual(0);


    const[KhacAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Khac Vy")],
      votingAddress,
    );

    const KhacCandidate = await votingProgram.account.candidate.fetch(KhacAddress);
    console.log(KhacCandidate);
    expect(KhacCandidate.candidateVotes.toNumber()).toEqual(0);

  });

  it("vote", async() => {
    await votingProgram.methods.vote("Saitama Coder", new anchor.BN(1)).rpc()


    const [SaitamaAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Saitama Coder")],
      votingAddress,
    );
    const SaitamaCandidate = await votingProgram.account.candidate.fetch(SaitamaAddress);
    console.log(SaitamaCandidate);
    expect(SaitamaCandidate.candidateVotes.toNumber()).toEqual(1);
  });
});

