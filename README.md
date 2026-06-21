<div align="center">

# 🌱 EcoIntercept AI

### AI Sustainability Layer for Online Shopping

*Instantly analyze products for sustainability scores, carbon footprint, greenwashing risks, and eco-friendly alternatives.*

[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Gemini AI](https://img.shields.io/badge/Powered%20By-Gemini%20AI-blue.svg)](https://ai.google.dev/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension%20Ready-brightgreen.svg)](#chrome-extension)

</div>

---

## 🚀 Overview

**EcoIntercept AI** is a full-stack sustainability intelligence platform that empowers online shoppers with real-time environmental impact data. It combines a premium React web dashboard with a downloadable Chrome extension — all powered by Google's Gemini AI.

### Core Engines

| Engine | Description |
|--------|-------------|
| **🌿 Eco Score Engine** | Dynamic 0-100 sustainability ratings based on materials, certifications, lifecycle, and recyclability |
| **💨 Carbon Impact Engine** | Lifecycle CO₂e footprint estimation in kilograms for any product |
| **🛡️ Greenwashing Detection** | AI-powered verification of eco-claims with risk classification (Low / Medium / High) |
| **🔍 Confidence Engine** | Multi-criteria weighted scoring with transparent audit methodology |
| **💡 Alternative Discovery Engine** | Recommends 2+ verified eco-friendly product alternatives per analysis |
| **⚡ Instant Swap Engine** | One-click comparison between conventional and sustainable alternatives |

### Key Features

- **Interactive Sustainability Simulator** — Analyze preset or custom products with real-time Gemini AI responses
- **Premium Glassmorphism UI** — Light-mode frosted glass design with micro-animations and smooth gradients
- **Chrome Extension Generator** — Server-side ZIP generation for one-click browser extension download
- **Educational Awareness Module** — Side-by-side comparison revealing hidden environmental costs
- **Marketplace Compatibility** — Works across Amazon, Flipkart, Myntra, Ajio, Meesho, Shopify, and more
- **Privacy-First Architecture** — Zero user tracking, fully anonymized analysis requests
- **High-Fidelity Sandbox Mode** — Graceful fallback with curated mock data when API quotas are exceeded

---

## 🏗️ Architecture

```
EcoIntercept AI
├── Frontend (React + Vite + TailwindCSS v4)
│   ├── Interactive product analysis simulator
│   ├── Educational environmental awareness sections
│   ├── Premium glassmorphism design system
│   └── Responsive layout with mobile navigation
│
├── Backend (Express + TypeScript)
│   ├── /api/analyze — Product sustainability analysis (Gemini 3.5 Flash)
│   ├── /api/generate-image — Environmental branding graphics (Gemini 3 Pro)
│   └── /api/download-extension — Chrome extension ZIP generator
│
└── Chrome Extension (Manifest V3)
    ├── Content script for e-commerce DOM injection
    ├── Popup UI with sustainability dashboard
    └── EcoScore badge overlay on product pages
```

---

## 📁 Project Structure

```
ecointercept-ai/
├── .env.example          # Environment variable template
├── .gitignore            # Git ignore rules
├── README.md             # Project documentation
├── index.html            # HTML entry point
├── metadata.json         # AI Studio metadata
├── package.json          # Dependencies & scripts
├── server.ts             # Express + Gemini AI backend
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
├── assets/               # Static assets
├── local-packages/       # Local dependency overrides
└── src/
    ├── App.tsx            # Main React application (2100+ lines)
    ├── data.ts            # Static data constants
    ├── index.css          # Global styles & design system
    ├── main.tsx           # React entry point
    └── types.ts           # TypeScript type definitions
```

---

## 🛠️ Run Locally

**Prerequisites:** Node.js (v18+)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gayatrishete619/ecointercept.ai.git
   cd ecointercept.ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Set `GEMINI_API_KEY` in `.env.local` to your [Google AI Studio](https://ai.studio) API key.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

> **Note:** The app runs in high-fidelity sandbox mode without an API key, using curated mock sustainability data.

---

## 🧩 Chrome Extension

The platform includes a built-in Chrome extension that injects sustainability badges directly into e-commerce product pages.

### Supported Stores
- Amazon (.com / .in)
- Flipkart
- Myntra
- Ajio
- Meesho
- Shopify stores

### Installation
1. Download the extension ZIP from the web dashboard
2. Extract to a local folder
3. Open `chrome://extensions/` in Chrome
4. Enable **Developer Mode** (toggle in top-right)
5. Click **Load unpacked** and select the extracted folder
6. Browse supported stores — EcoScore badges appear automatically

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6, TailwindCSS v4 |
| Backend | Express 4, Node.js, TypeScript |
| AI Engine | Google Gemini 3.5 Flash (analysis), Gemini 3 Pro (image generation) |
| Animations | Framer Motion (motion/react) |
| Icons | Lucide React |
| Build Tools | Vite, esbuild, tsx |
| Extension | Chrome Manifest V3 |

---

## 🔒 Security

- No API keys or secrets are stored in the codebase
- All sensitive values are loaded from environment variables at runtime
- `.env*` files are excluded from version control via `.gitignore`
- Chrome extension operates in client-isolated sandboxing with zero user tracking

---

## 👥 Contributors

- **gayatrishete619** — Repository Owner
- **AtharvCodingHub-888** — Contributor

---

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).

---

<div align="center">

**Built with 🌱 for a sustainable future**

*EcoIntercept AI — Making every purchase count for the planet*

</div>
