# Taboo Alchemist 🧙‍♂️

**GenLayer Portal Submission**
**Type:** Mini-games for GenLayer's Community

*A mystical, AI-powered word guessing game built on the concepts of GenLayer's Optimistic Democracy and LLM consensus.*

## 📖 Short Description
**How it Works:**
* **The Gameplay Loop:** Players are presented with a "Target Word" and a list of "Taboo Words" they cannot use. Their goal is to craft the perfect hint to make the AI guess the target.
* **GenLayer Integration:** The game interacts with our deployed Intelligent Contract on the GenLayer Testnet Asimov. Players connect their Web3 wallets to submit their hints, which are then processed via intelligent consensus to evaluate if the AI successfully guessed the word without the player triggering any taboo constraints.
* **On-Chain Elements:** Once a level is cleared, players can interact directly with the GenLayer network, submitting a raw transaction containing their game payload to record their progress.

**Technical Stack:**
* **Frontend:** React, HTML5, Tailwind CSS, Vite, Ethers.js.
* **Smart Contract:** Python (GenLayer Intelligent Contract format).
* **Blockchain:** GenLayer Testnet Asimov

**Why it fits the GenLayer Community:**
It acts as both a community-engaging game and an educational tool. It interactively teaches players how Large Language Models (LLMs) parse prompts under GenLayer's consensus mechanisms, wrapping a complex technological breakthrough inside a highly polished, addictive mini-game.

### 🔗 Important Links
**Deployed Contract (Testnet Asimov):** [`0x1D241e67Bdb32D50E5D3B12ADF4c9C1426B0e422`](https://explorer-studio.genlayer.com/address/0x1D241e67Bdb32D50E5D3B12ADF4c9C1426B0e422)

---

## ✨ Features

- **Strategic Gameplay:** Formulate single-hint descriptions to guide the Oracle while avoiding strictly forbidden "Taboo Words".
- **Immersive UI/UX:** Built with a dark, magical aesthetic, featuring fluid animations, glows, and responsive typography (Inter & Playfair Display).
- **Simulated Web3 & Consensus Engine:** Mimics GenLayer's native `gl.nondet.exec_prompt` resolution right in the browser, showing how Intelligent Smart Contracts process subjective data without needing actual API keys on the frontend.
- **Progressive Difficulty:** Multiple levels with different target words and increasingly constrained taboo lists.

## 📁 Project Structure

- **/contracts/TabooAlchemist.py**: The Native GenLayer Python Smart Contract concept.
- **/src**: The React Frontend (Vite + Tailwind) featuring the magical UI and Web3 interaction simulator.

## 🚀 How to Deploy React Frontend

Since you have exported this to GitHub, deploying to **Vercel** is seamless:

1. Push all changes to this repository on GitHub.
2. Log into [Vercel](https://vercel.com).
3. Click **Add New Project** and import your repository.
4. Ensure the Framework Preset is set to `Vite`.
5. Deploy! No environment variables (like `GEMINI_API_KEY`) are required as the consensus is currently handled via the built-in simulator.

---

## 🔮 About GenLayer: The Intelligent Execution Layer

**GenLayer** is the first decentralized execution layer that introduces AI natively into Smart Contracts. By replacing rigid opcode executions with a dynamic, LLM-driven consensus mechanism known as **Optimistic Democracy**, GenLayer enables subjective logic on the blockchain.

### Why GenLayer?
Traditional smart contracts (like those on EVM) are deterministic and operate on strict `true`/`false` logic. They cannot read natural language or natively browse the web without complex external oracles. 

GenLayer introduces **Intelligent Smart Contracts (ISCs)** that are written in Python. ISCs can:
- Execute Large Language Model (LLM) prompts directly via `gl.nondet.exec_prompt()`.
- Fetch external web data without deterministic oracles using `gl.nondet.exec_web()`.
- Reach decentralized consensus on non-deterministic data seamlessly and securely.

### Intelligent Smart Contract (ISC) Example
In a true GenLayer environment, an ISC for a game like this uses native Python syntax and functions:

```python
import json

def submit_hint(hint: str) -> str:
    # 1. Native Nondeterministic LLM Execution
    task_def = """
    Guess the exact secret word based on this hint.
    Rules: Output EXACTLY ONE WORD. No punctuation.
    """
    oracle_guess = gl.nondet.exec_prompt(task_def, f"Hint: {hint}")

    # 2. State Mutation Based on AI Consensus runs automatically
    # across the Validator network!
    if oracle_guess.strip().upper() == TARGET_WORD:
        return "Consensus Reached! Game Won."
    else:
        # Invalid guess or hallucination, state reverts!
        raise Exception(f"Oracle guessed {oracle_guess}, which was incorrect.")
```
*Note: This simulation represents the power of GenLayer validators coming to a single, provable truthful outcome over subjective language.*

### 🛠️ GenLayer Studio (Web IDE)
Ready to write your own ISCs? **[GenLayer Studio](https://studio.genlayer.com)** is a powerful, fully-featured web-based IDE tailored specifically for developing, testing, and deploying Intelligent Smart Contracts.

- **Zero Config Setup:** Start coding your smart contracts in Python immediately right in your browser.
- **Interactive Simulator:** Test deterministic code alongside nondeterministic LLM executions (`gl.nondet.exec_prompt`) in a locally sandboxed blockchain environment.
- **One-Click Deploy:** Push your ISCs directly to the GenLayer testnet.
- **On-Chain Debugging:** Visualize optimistic consensus logic, validator behavior, and LLM outputs in real time through the integrated explorer.

### 📚 GenLayer Developer Resources
Dive into the documentation, learn the architecture, and start building Intelligent Smart Contracts!

- 📖 **Official Documentation:** [docs.genlayer.com](https://docs.genlayer.com)
- 🌐 **GenLayer Website:** [genlayer.com](https://genlayer.com)
- 💻 **GenLayer Simulator CLI:** [GenLayer CLI Docs](https://docs.genlayer.com/build/cli)
- 🐦 **X (Twitter):** [@GenLayer](https://x.com/GenLayer)

> *"Bridging the gap between rigid machine code and human subjectivity."*