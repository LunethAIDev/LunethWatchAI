import { z } from "zod"
import {
  LUNETH_GET_ALL_BALANCES,
  LUNETH_GET_BALANCE,
  LUNETH_RESOLVE_MINT,
  LUNETH_GET_WALLET,
  LUNETH_TRANSFER
} from "@/lunethwatch/action-names"
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction
} from "@solana/web3.js"
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createTransferInstruction
} from "@solana/spl-token"

/* ========= Types ========= */

export interface ActionResponse<T> {
  notice: string
  data?: T
}

export interface Context {
  connection: Connection
  walletPubkey: PublicKey
  sendTx: (tx: Transaction) => Promise<string>
}

export interface ActionCore<S extends z.ZodTypeAny, R> {
  id: string
  summary: string
  input: S
  execute: (opts: { payload: z.infer<S>; context: Context }) => Promise<ActionResponse<R>>
}

type Action = ActionCore<any, any>

/* 1. Get wallet */
export const getWallet: ActionCore<z.ZodObject<{}>, { walletAddress: string }> = {
  id: LUNETH_GET_WALLET,
  summary: "Retrieve tracked wallet address",
  input: z.object({}),
  execute: async ({ context }) => ({
    notice: "Wallet address obtained",
    data: { walletAddress: context.walletPubkey.toBase58() }
  })
}

/* 2. Get balance */
export const getBalance: ActionCore<
  z.ZodObject<{ mint: z.ZodString }>,
  { balance: number }
> = {
  id: LUNETH_GET_BALANCE,
  summary: "Fetch SOL or SPL token balance",
  input: z.object({ mint: z.string() }),
  execute: async ({ payload, context }) => {
    if (payload.mint === "SOL") {
      const lamports = await context.connection.getBalance(context.walletPubkey)
      return { notice: "SOL balance", data: { balance: lamports / LAMPORTS_PER_SOL } }
    }
    const mintKey = new PublicKey(payload.mint)
    const ata = getAssociatedTokenAddressSync(mintKey, context.walletPubkey)
    const info = await context.connection.getParsedAccountInfo(ata)
    const uiAmount = info.value && "parsed" in info.value.data
      ? (info.value.data.parsed.info.tokenAmount.uiAmount as number)
      : 0
    return { notice: "Token balance", data: { balance: uiAmount } }
  }
}

/* 3. Get all balances */
export const getAllBalances: ActionCore<z.ZodObject<{}>, { balances: Record<string, number> }> = {
  id: LUNETH_GET_ALL_BALANCES,
  summary: "List SOL and all SPL balances",
  input: z.object({}),
  execute: async ({ context }) => {
    const balances: Record<string, number> = {}
    const solLam = await context.connection.getBalance(context.walletPubkey)
    balances.SOL = solLam / LAMPORTS_PER_SOL
    const tokenAccounts = await context.connection.getParsedTokenAccountsByOwner(
      context.walletPubkey,
      { programId: TOKEN_PROGRAM_ID }
    )
    tokenAccounts.value.forEach(acc => {
      const parsed = (acc.account.data as any).parsed.info
      balances[parsed.mint] = parsed.tokenAmount.uiAmount
    })
    return { notice: "All balances", data: { balances } }
  }
}

/* 4. Resolve mint */
const MINT_MAP: Record<string, string> = {
  USDC: "Es9vMFrzaC1...",
  RAY:  "4k3Dyjzvzp8..."
}

export const resolveMint: ActionCore<
  z.ZodObject<{ symbol: z.ZodString }>,
  { mintAddress: string }
> = {
  id: LUNETH_RESOLVE_MINT,
  summary: "Resolve SPL token mint from symbol",
  input: z.object({ symbol: z.string() }),
  execute: async ({ payload }) => {
    const mint = MINT_MAP[payload.symbol.toUpperCase()]
    if (!mint) throw new Error(`Unknown symbol: ${payload.symbol}`)
    return { notice: "Mint resolved", data: { mintAddress: mint } }
  }
}

/* 5. Transfer */
export const transfer: ActionCore<
  z.ZodObject<{
    recipient: z.ZodString
    amount: z.ZodNumber
    mint: z.ZodString
  }>,
  { txSignature: string }
> = {
  id: LUNETH_TRANSFER,
  summary: "Transfer SOL or SPL tokens",
  input: z.object({
    recipient: z.string(),
    amount: z.number().positive(),
    mint: z.string()
  }),
  execute: async ({ payload, context }) => {
    const to = new PublicKey(payload.recipient)
    const tx = new Transaction()
    if (payload.mint === "SOL") {
      tx.add(SystemProgram.transfer({
        fromPubkey: context.walletPubkey,
        toPubkey: to,
        lamports: payload.amount * LAMPORTS_PER_SOL
      }))
    } else {
      const mintKey = new PublicKey(payload.mint)
      const fromAta = getAssociatedTokenAddressSync(mintKey, context.walletPubkey)
      const toAta = getAssociatedTokenAddressSync(mintKey, to)
      tx.add(createTransferInstruction(
        fromAta, toAta, context.walletPubkey,
        payload.amount, [], TOKEN_PROGRAM_ID
      ))
    }
    const sig = await context.sendTx(tx)
    return { notice: "Transfer done", data: { txSignature: sig } }
  }
}
