# Voting DApp

Voting DApp is a decentralized application built with Next.js and Solana, allowing users to participate in on-chain voting. The project leverages Tailwind CSS for styling, Solana's web3.js for wallet interactions, and Anchor for smart contract development.

## Features

- **On-chain Voting:** Secure, transparent voting powered by Solana smart contracts.
- **Wallet Integration:** Connect and interact with your Solana wallet.
- **Modern UI:** Responsive design using Tailwind CSS.
- **Anchor-based Program:** Voting logic implemented in Rust with Anchor.

## Getting Started

### Prerequisites

- Node.js & pnpm installed
- Solana CLI tools
- Anchor CLI

### Installation

Clone the repository and install dependencies:

```shell
git clone <your-repo-url>
cd voting-dapp
pnpm install
```

### Running the App

Start the web application:

```shell
pnpm dev
```

Build for production:

```shell
pnpm build
```

### Solana Program (Anchor)

Navigate to the `anchor` directory to build, test, and deploy the voting smart contract.

#### Build the Program

```shell
pnpm anchor-build
```

#### Start Local Validator

```shell
pnpm anchor-localnet
```

#### Run Tests

```shell
pnpm anchor-test
```

#### Deploy to Devnet

```shell
pnpm anchor deploy --provider.cluster devnet
```

## Project Structure

- `web/` — Frontend React app
- `anchor/` — Solana smart contract (Rust/Anchor)
- `counter-exports.ts` — Program ID and client exports

## Contributing

Feel free to open issues or submit pull requests for improvements and new features.
