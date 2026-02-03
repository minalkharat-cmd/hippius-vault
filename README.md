# 🏦 HippiusVault

> **Decentralized code storage for vibe-coded projects**
>
> Store your source code on Hippius (Bittensor Subnet 75), get on-chain proof on Base, and link to Trenches token launches. Built for the CreatorBid Vibe Coding Hackathon.
>
> ![HippiusVault Banner](https://img.shields.io/badge/Powered%20by-Hippius-blue?style=for-the-badge)
> ![Base Chain](https://img.shields.io/badge/Chain-Base-0052FF?style=for-the-badge)
> ![Hackathon](https://img.shields.io/badge/CreatorBid-Hackathon-orange?style=for-the-badge)
>
> ## 🎯 Problem
>
> In the world of tokenized vibe-coded projects, **trust is everything**. Yet:
> - Developers can rug pull by swapping code after launch
> - - Investors can't verify what code backs their tokens
>   - - No transparency = no trust = limited adoption
>    
>     - ## 💡 Solution
>    
>     - **HippiusVault** creates an immutable record of your project's code:
>    
>     - 1. **Upload** your source code to Hippius decentralized storage
> 2. **Record** the IPFS hash on Base blockchain
> 3. 3. **Link** to your Trenches token launch
>    4. 4. **Verify** - anyone can check the code backing any token
>      
>       5. ## 🏗️ Architecture
>      
>       6. ```
>          ┌─────────────────────────────────────────────────────────────┐
>          │                      USER FLOW                              │
>          ├─────────────────────────────────────────────────────────────┤
>          │                                                             │
>          │  [Connect Wallet] → [Upload Code] → [Get IPFS Hash]        │
>          │         │                │                │                 │
>          │         ▼                ▼                ▼                 │
>          │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
>          │  │   Base L2    │  │   Hippius    │  │  Trenches    │      │
>          │  │  (On-chain   │  │   S3 API     │  │  Integration │      │
>          │  │   Proof)     │  │  (Storage)   │  │  (Token Link)│      │
>          │  └──────────────┘  └──────────────┘  └──────────────┘      │
>          └─────────────────────────────────────────────────────────────┘
>          ```
>
> ## 🚀 Features
>
> | Feature | Description |
> |---------|-------------|
> | **Immutable Storage** | Code stored on Hippius/IPFS - can't be deleted |
> | **On-chain Proof** | IPFS hash recorded on Base blockchain |
> | **Trenches Integration** | Link vaults to token launches |
> | **Public Verification** | Anyone can verify code backing tokens |
> | **Version Tracking** | Track code changes over time |
>
> ## 🛠️ Tech Stack
>
> - **Frontend**: Next.js 14, TailwindCSS, wagmi, viem
> - - **Storage**: Hippius S3 API (Bittensor Subnet 75)
>   - - **Blockchain**: Base L2 (Ethereum)
>     - - **Smart Contracts**: Solidity, Hardhat
>      
>       - ## 📦 Project Structure
>      
>       - ```
>         hippius-vault/
>         ├── frontend/           # Next.js frontend app
>         │   ├── app/           # App router pages
>         │   ├── components/    # React components
>         │   ├── hooks/         # Custom hooks
>         │   └── lib/           # Utilities & API
>         ├── contracts/         # Solidity smart contracts
>         │   ├── src/          # Contract source
>         │   └── test/         # Contract tests
>         └── docs/             # Documentation
>         ```
>
> ## 🏃 Quick Start
>
> ### Prerequisites
> - Node.js 18+
> - - pnpm
>   - - A Hippius account (get one at https://console.hippius.com)
>    
>     - ### Installation
>    
>     - ```bash
>       # Clone the repo
>       git clone https://github.com/minalkharat-cmd/hippius-vault.git
>       cd hippius-vault
>
>       # Install dependencies
>       cd frontend && pnpm install
>
>       # Set up environment variables
>       cp .env.example .env.local
>       # Add your Hippius API keys
>
>       # Run development server
>       pnpm dev
>       ```
>
> ## 🔑 Environment Variables
>
> ```env
> # Hippius S3 API
> HIPPIUS_ACCESS_KEY=hip_your_key
> HIPPIUS_SECRET_KEY=your_secret
>
> # Base RPC
> NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
>
> # Contract Address (after deployment)
> NEXT_PUBLIC_VAULT_CONTRACT=0x...
> ```
>
> ## 📜 Smart Contract
>
> The `HippiusVault` contract on Base records:
> - IPFS hash of uploaded code
> - - Creator address
>   - - Timestamp
>     - - Project name
>       - - Link to Trenches token (optional)
>        
>         - ## 🤝 Contributing
>        
>         - This project was built for the CreatorBid Vibe Coding Hackathon. Contributions welcome!
>        
>         - ## 📄 License
>
> MIT License - see [LICENSE](LICENSE) for details.
>
> ## 🔗 Links
>
> - [Hippius](https://hippius.com) - Decentralized Cloud Storage
> - - [CreatorBid](https://creator.bid) - AI Agent Platform
>   - - [Trenches](https://trenches.bid) - Token Launch Platform
>     - - [Base](https://base.org) - Ethereum L2
>      
>       - ---
>
> **Built with 💜 for the Vibe Coding Trenches Challenge**
