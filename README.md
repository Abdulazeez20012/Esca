# Esca - Web3 Escrow Platform on Sui

<div align="center">
  <img src="./docs/assets/logo.png" alt="Esca Logo" width="200" height="200">
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Sui Network](https://img.shields.io/badge/Built%20on-Sui-blue)](https://sui.io/)
  [![Next.js](https://img.shields.io/badge/Frontend-Next.js-black)](https://nextjs.org/)
  [![Move](https://img.shields.io/badge/Smart%20Contracts-Move-purple)](https://move-book.com/)
</div>

## 🌟 Overview

Esca is a decentralized escrow platform built on the Sui blockchain, enabling secure multi-asset transactions between parties. Our platform supports SUI tokens, USDC, NFTs, and on-chain objects, providing a comprehensive solution for trustless value exchange.

## 🚀 Features

- **Multi-Asset Support**: SUI, USDC, NFTs, and custom on-chain objects
- **Secure Vault System**: Smart contract-powered escrow vaults
- **Web3 Integration**: Seamless Sui Wallet Kit integration
- **Modern UI/UX**: Built with Next.js, TailwindCSS, and shadcn/ui
- **Arbitration System**: Optional dispute resolution mechanism
- **Real-time Notifications**: Backend-powered notification system

## 🏗️ Project Structure

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

## 🛠️ Tech Stack

### Smart Contracts
- **Move Language**: Sui blockchain smart contracts
- **Sui CLI**: Development and deployment tools

### Frontend
- **Next.js 14**: React framework with App Router
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Modern component library
- **Sui Wallet Kit**: Web3 wallet integration
- **TypeScript**: Type-safe development

### Backend (Optional)
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: Database for notifications and arbitration
- **WebSockets**: Real-time communication

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Sui CLI installed
- Git

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

## 📖 Documentation

- [Product Requirements Document](./docs/PRD.md)
- [Smart Contract Documentation](./contracts/README.md)
- [Frontend Development Guide](./frontend/README.md)
- [Backend API Reference](./backend/README.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 👥 Team Collaboration

This project is structured for collaborative development:

- **Product Manager**: Focus on `/docs` for requirements and specifications
- **Contract Engineer**: Work in `/contracts` for smart contract development
- **Frontend Engineers**: Develop in `/frontend` with clear component separation
- **Backend Engineer**: Build APIs in `/backend` for extended functionality

## 🤝 Contributing

Please read our [Contributing Guidelines](./docs/CONTRIBUTING.md) before submitting any pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Sui Documentation](https://docs.sui.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## 📧 Contact

For questions and support, please reach out to our team or create an issue in this repository.

---

<div align="center">
  <p>Built with ❤️ for the Sui ecosystem</p>
</div>