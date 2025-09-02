**Product Requirements Document (PRD)**

# Esca - Web3 Escrow Platform on Sui

## Problem Statement

In Web2 freelancing and peer-to-peer payments, escrow platforms charge high fees, suffer from slow dispute resolution, and often rely on centralized entities.
In Web3, most transactions are trust-based (direct wallet transfers), which exposes users to scams, failed payments, and disputes.
There’s no simple, low-fee, multi-asset escrow solution on Sui for everyday users.
##  Overview
**ESCA** is a decentralized escrow platform built on the Sui blockchain, enabling secure multi-asset transactions between parties. Our platform supports SUI tokens, USDC, NFTs, and on-chain objects, providing a comprehensive solution for trustless value exchange.
Funds are only released when conditions are met: direct approval, verifier confirmation, or automated fallback.
Supports gifting and freelancer payments.
## Goals & Objectives
- To Build a trustless escrow system.
- Enable multi-asset support (coins, NFTs, objects).
- Provide a modern, intuitive UI/UX for Web3 and non-crypto-native users.
- Offer flexible release mechanisms (direct, verifier, time-based).
## Core Features (MVP)
- Vault Creation
  • Create an escrow vault with assets (SUI, USDC, NFT, object).
  • Define recipient, verifiers (optional), and expiry time.

- Vault Confirmation
  • Verifiers can approve or reject the vault release.
  • Recipient can see vault status.

- Vault Release
  • Direct release (sender approves).
  • Multi-verifier release (signatures from verifiers).
  • Auto-release after expiry if no dispute.

- Multi-Asset Support
  • Native support for SUI, USDC, NFTs, objects.

- Gifting & Payments
  • Send vaults as gifts (coins + NFTs).
  • Secure payments for freelancers and P2P trades.
## Tech Stack
- Smart Contracts: Move (Sui blockchain).
- Frontend: Next.js (React + TypeScript), TailwindCSS, shadcn/ui.
- Wallet Integration: Sui Wallet Kit.
- Backend/Indexing (Optional): Supabase, Sui GraphQL API.
- Deployment: Walrus (frontend), Sui testnet (contracts).

## 5-Day Deliverables Roadmap
**Day 1** – ***Foundation***
- Define smart contract architecture (vault creation, release, dispute handling).
- Write initial Move smart contract skeleton for Sui blockchain.
- Set up GitHub repo + documentation structure.

**Day 2** – ***Smart Contract Development***
- Implement escrow vault creation & deposit function.
- Implement vault release logic (direct, verifier-based, expiry fallback).
- Write unit tests (on Sui testnet).

**Day 3** – ***Frontend***
- Build simple Next.js interface (connect wallet, create vault, view vaults).
- Integrate Sui Wallet Kit.
- Display vault status (active, released, expired).

**Day 4** – ***Integration & Demo Flow***
- Connect frontend with deployed smart contracts.
- Test full demo flow:
- Person A deposits → Person B notified → Verifier approves → Funds released.
- Add multi-asset support (SUI, USDC, NFT, object).

**Day 5** – ***Polish & Delivery***
- Finalize UI (basic Tailwind styling).
- Deploy frontend to Walrus, contracts to Sui testnet.
- Prepare demo video + README.
- Deliver packaged project (repo + docs + live demo link).

## Project Structure

```
Esca/
├── contracts/          # Move smart contracts
├── frontend/          # Next.js web application
├── backend/           # Node.js/Express API (optional)
├── docs/              # Documentation and assets
├── README.md
├── .gitignore
├── LICENSE
└── package.json
```

### Frontend
- **Next.js 14**: React framework with App Router
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Modern component library
- **Sui Wallet Kit**: Web3 wallet integration
- **TypeScript**: Type-safe development

### Backend (Optional)
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **WebSockets**: Real-time communication

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/esca.git
   cd esca
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install && cd ..
   
   # Install backend dependencies (optional)
   cd backend && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   ```

4. **Deploy smart contracts**
   ```bash
   cd contracts
   sui client publish --gas-budget 20000000
   ```

5. **Start development servers**
   ```bash
   # Start frontend (in one terminal)
   cd frontend && npm run dev
   
   # Start backend (in another terminal, optional)
   cd backend && npm run dev
   ```

## Team Collaboration

This project is structured for collaborative development:

- ***Matthew Okere***: **Product Manager** - Focus on `/docs` for requirements and specifications
- ***Odunaye Abdulhafeez***: **Contract Engineer** - Work in `/contracts` for smart contract development
- ***Asade Olawale Peter***: **Frontend Engineers** - Develop in `/frontend` with clear component separation
- ***Muhammad Abdulazeez***: **Backend Engineer** - Build APIs in `/backend` for extended functionality

##  Contributing

Please read our [Contributing Guidelines](./docs/CONTRIBUTING.md) before submitting any pull requests.

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## Contact

For questions and support, please reach out to our team(Tribe) or create an issue in this repository.

---

<div align="center">
  <p>Building with ❤️ for the Sui ecosystem</p>
</div>