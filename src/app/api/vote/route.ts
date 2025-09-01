import {
  ActionGetResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import type { Voting } from "../../../../anchor/target/types/voting";
const IDL = require("../../../../anchor/target/idl/voting.json");

const PROGRAM_ID = new PublicKey(
  "E5VCLHNcqe8st2xXqWnVus49zGPTQVkLqqwd4JMjoFFN"
);

export const OPTIONS = GET;

export async function GET(request: Request) {
  const actionMetaData: ActionGetResponse = {
    icon:
      "https://cdn.pixabay.com/photo/2023/08/24/19/58/saitama-8211499_1280.png",
    title: "Vote for your favorite Solana developer",
    description: "Choose wisely and make your voice heard!",
    label: "Vote",
    links: {
      actions: [
        {
          label: "vote for Saitama Coder",
          href: "/api/vote?candidate=Saitama%20Coder",
          type: "transaction",
        },
        {
          label: "vote for Khac Vy",
          href: "/api/vote?candidate=Khac%20Vy",
          type: "transaction",
        },
      ],
    },
  };

  return Response.json(actionMetaData, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidateRaw = url.searchParams.get("candidate");
  const candidate = candidateRaw ? decodeURIComponent(candidateRaw) : null;

  if (!candidate || (candidate !== "Saitama Coder" && candidate !== "Khac Vy")) {
    return Response.json(
      { error: "Invalid candidate" },
      { status: 400, headers: ACTIONS_CORS_HEADERS }
    );
  }

  let body: ActionPostRequest;
  try {
    body = await request.json();
  } catch (err) {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400, headers: ACTIONS_CORS_HEADERS }
    );
  }

  let voter: PublicKey;
  try {
    voter = new PublicKey(body.account);
  } catch {
    return Response.json(
      { error: "Invalid account" },
      { status: 400, headers: ACTIONS_CORS_HEADERS }
    );
  }

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: Transaction) => tx,
    signAllTransactions: async (txs: Transaction[]) => txs,
  } as any;

  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });

  const program: Program<Voting> = new Program(IDL as any, provider);

  const pollId = new BN(1);

  const pollSeed = Buffer.from(pollId.toArrayLike(Buffer, "le", 8));
  const candidateSeed = Buffer.from(candidate);

  const [pollPda] = PublicKey.findProgramAddressSync([pollSeed], PROGRAM_ID);
  const [candidatePda] = PublicKey.findProgramAddressSync(
    [pollSeed, candidateSeed],
    PROGRAM_ID
  );

  const instructions = [];

  try {
    const pollInfo = await connection.getAccountInfo(pollPda);
    if (!pollInfo) {
      const now = Math.floor(Date.now() / 1000);
      const defaultDescription = "Auto-created poll";
      const defaultPollStart = new BN(now);
      const defaultPollEnd = new BN(now + 7 * 24 * 3600); 

      const initPollIx = await program.methods
        .initializePoll(pollId, defaultDescription, defaultPollStart, defaultPollEnd, new BN(0))
        .accounts({
          signer: voter,
          poll: pollPda,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      instructions.push(initPollIx);
    }

    const candidateInfo = await connection.getAccountInfo(candidatePda);
    if (!candidateInfo) {
      const initCandidateIx = await program.methods
        .initializeCandidate(candidate, pollId)
        .accounts({
          signer: voter,
          poll: pollPda,
          candidate: candidatePda,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      instructions.push(initCandidateIx);
    }

    const voteIx = await program.methods
      .vote(candidate, pollId)
      .accounts({
        signer: voter,
        poll: pollPda,
        candidate: candidatePda,
      })
      .instruction();

    instructions.push(voteIx);
  } catch (err: any) {
    return Response.json(
      { error: "Failed to build instructions", details: err?.toString?.() ?? err },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }

  const blockhash = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({
    feePayer: voter,
    recentBlockhash: blockhash.blockhash,
  });

  for (const ix of instructions) tx.add(ix);
  
  const response = await createPostResponse({
    fields: {
      transaction: tx,
      type: "transaction",
    },
  });

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}
