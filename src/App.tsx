/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Ghost, Sparkles, TerminalSquare, AlertTriangle, Send, Loader2, Github, CheckCircle2, XCircle, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
// You can replace this with actual parsing of the GenLayer transaction receipt/events later.
const simulateGenLayerConsensus = (hint: string, target: string) => {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      // Very basic simulation: if the hint is longer than 5 chars, we pretend GenLayer guessed it correctly
      if (hint.length > 5) {
        resolve(target.toUpperCase());
      } else {
        resolve("UNKNOWN");
      }
    }, 2500); // simulate network delay
  });
};

// The deployed GenLayer Contract
const CONTRACT_ADDRESS = "0x1D241e67Bdb32D50E5D3B12ADF4c9C1426B0e422";

// Extend Window interface for Ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

const LEVELS = [
  { target: "Apple", taboo: ["Fruit", "Red", "Tree", "Newton", "iPhone", "Steve Jobs"] },
  { target: "Ocean", taboo: ["Water", "Sea", "Blue", "Fish", "Waves", "Beach"] },
  { target: "Clock", taboo: ["Time", "Tick", "Watch", "Hour", "Minute", "Hands"] },
  { target: "Fire", taboo: ["Hot", "Burn", "Flame", "Heat", "Wood", "Smoke"] },
  { target: "Ghost", taboo: ["Haunt", "Scary", "Spirit", "Dead", "Boo", "Invisible"] },
  { target: "Money", taboo: ["Cash", "Dollar", "Buy", "Pay", "Coin", "Rich"] },
];

export default function App() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [hint, setHint] = useState('');
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'evaluating' | 'won' | 'lost' | 'incorrect'>('intro');
  const [aiGuess, setAiGuess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  const currentLevel = LEVELS[levelIndex];

  const getEthereum = () => {
    if (typeof window === 'undefined') return null;
    try {
      return window.ethereum;
    } catch (err) {
      console.warn("Wallet injection error:", err);
      return null;
    }
  };

  useEffect(() => {
    const eth = getEthereum();
    if (eth) {
      eth.request({ method: 'eth_chainId' }).then((id: string) => setChainId(id)).catch(console.error);
      
      const handleChainChanged = (id: string) => setChainId(id);
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) setWalletAddress(accounts[0]);
        else setWalletAddress(null);
      };

      eth.on('chainChanged', handleChainChanged);
      eth.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (eth.removeListener) {
          eth.removeListener('chainChanged', handleChainChanged);
          eth.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  const switchNetwork = async () => {
    const eth = getEthereum();
    if (!eth) return;
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xf22f' }], // GenLayer Studio Testnet (61999)
      });
    } catch (switchError: any) {
      if (switchError?.message?.includes("isZerion") || switchError?.message?.includes("Cannot redefine property")) {
         alert("Your wallet extension (like Zerion) is causing a conflict inside this preview iframe. Please click the 'Open in New Tab' icon at the top right of the preview window to interact with your wallet.");
         return;
      }
      
      if (switchError.code === 4902 || (switchError.message && switchError.message.includes('Unrecognized chain ID'))) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xf22f',
                chainName: 'GenLayer Studio',
                rpcUrls: ['https://studio.genlayer.com/api'],
                nativeCurrency: { name: 'GenLayer', symbol: 'GEN', decimals: 18 },
              },
            ],
          });
        } catch (addError: any) {
          console.error('Failed to add GenLayer network', addError);
          if (addError?.message?.includes("isZerion") || addError?.message?.includes("Cannot redefine property")) {
            alert("Your wallet extension (like Zerion) is causing a conflict inside this preview iframe. Please click the 'Open in New Tab' icon at the top right of the preview window to interact with your wallet.");
          } else {
            alert('Failed to add GenLayer network. Please open in a new tab or add it manually.');
          }
        }
      } else if (switchError.code !== 4001) {
        console.error('Failed to switch network', switchError);
      }
    }
  };

  // Try to connect to GenLayer Simulator (or custom network) network
  const connectWallet = async () => {
    const eth = getEthereum();
    if (eth) {
      try {
        const accounts = await eth.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);

        // Auto Switch to GenLayer Testnet / Simulator
        await switchNetwork();
      } catch (err: any) {
        console.error("Connection failed", err);
        if (err?.message?.includes("isZerion") || err?.message?.includes("Cannot redefine property")) {
           alert("Your wallet extension (like Zerion) is causing a conflict inside this preview iframe. Please click the 'Open in New Tab' icon at the top right of the preview window to connect your wallet.");
        }
      }
    } else {
      alert('Please install MetaMask, Rabby, or a similar Web3 wallet!');
    }
  };

  const handleSubmit = async () => {
    if (!hint.trim()) return;

    // 1. Validation (Frontend logic simulating contract input validation)
    const normalizedHint = hint.toLowerCase();
    
    // Check for target word
    if (normalizedHint.includes(currentLevel.target.toLowerCase())) {
      setErrorMsg(`Violation! You cannot use the Target Word "${currentLevel.target}"!`);
      setGameState('lost');
      return;
    }

    // Check for taboo words
    const usedTaboo = currentLevel.taboo.find(word => normalizedHint.includes(word.toLowerCase()));
    if (usedTaboo) {
      setErrorMsg(`Violation! You used the taboo word: "${usedTaboo}"`);
      setGameState('lost');
      return;
    }

    setGameState('evaluating');
    setAiGuess(null);
    setErrorMsg(null);
    setTxHash(null);

    // IF WALLET IS CONNECTED: Trigger a real Web3 transaction!
    const eth = getEthereum();
    if (walletAddress && eth) {
      try {
        const text = `GenLayer:Taboo:${hint}`;
        const utf8Encoder = new TextEncoder();
        const bytes = utf8Encoder.encode(text);
        const hexData = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        
        const returnedTxHash = await eth.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: walletAddress,
              to: CONTRACT_ADDRESS,
              value: '0x0',
              data: hexData,
            },
          ],
        });
        
        console.log("Transaction Hash:", returnedTxHash);
        setTxHash(returnedTxHash);
        
      } catch (err: any) {
        console.error("Tx failed:", err);
        const errMsg = err.message || "";
        
        // If the error is a known extension conflict in iframes (like Zerion),
        // we can bypass the transaction block and still let the user play the game.
        if (errMsg.includes("isZerion") || errMsg.includes("Cannot redefine property")) {
           console.warn("Wallet extension conflict detected in iframe. Skipping transaction and proceeding to game logic...");
        } else if (err.code === 4001 || errMsg.toLowerCase().includes("rejected")) {
           // User rejected the transaction
           setErrorMsg("Transaction was rejected by wallet.");
           setGameState('lost');
           return;
        } else {
           setErrorMsg(errMsg || "Transaction failed. Try opening the app in a new tab if your wallet extension is blocking it.");
           setGameState('lost');
           return;
        }
      }
    }

    // 2. Evaluation via GenLayer (Simulating GenLayer's native gl.nondet.exec_prompt consensus)
    try {
      const cleanGuess = await simulateGenLayerConsensus(hint, currentLevel.target);
      
      setAiGuess(cleanGuess);

      if (cleanGuess === currentLevel.target.toUpperCase()) {
        setGameState('won');
        setScore(s => s + 100);
      } else {
        setGameState('incorrect');
        setErrorMsg(`The Oracle guessed: ${cleanGuess} (or similar). It was incorrect!`);
      }

    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to reach consensus. The Oracle is asleep.");
      setGameState('lost');
    }
  };

  const handleNextLevel = () => {
    if (levelIndex < LEVELS.length - 1) {
      setLevelIndex(i => i + 1);
    } else {
      setLevelIndex(0); // Reset for simplicity
      setScore(0);
    }
    setHint('');
    setGameState('playing');
    setAiGuess(null);
    setErrorMsg(null);
    setTxHash(null);
  };

  const handleRetry = () => {
    setHint('');
    setGameState('playing');
    setAiGuess(null);
    setErrorMsg(null);
    setTxHash(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0502] text-neutral-100 font-sans selection:bg-[#ff4e00]/30 overflow-hidden relative">
      {/* Ambient background glows */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-80 z-0"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #3a1510 0%, transparent 60%), radial-gradient(circle at 10% 80%, #431278 0%, transparent 50%), radial-gradient(circle at 80% 20%, #ff4e00 0%, transparent 40%)',
          filter: 'blur(80px)'
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-3xl">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-[#ff4e00]/30 rounded-full flex items-center justify-center bg-[#ff4e00]/10">
              <Sparkles className="w-5 h-5 text-[#ff4e00]" />
            </div>
            <span className="font-serif tracking-wide text-2xl text-white">Taboo <span className="text-[#ff4e00] italic font-light">Alchemist</span></span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm font-mono flex flex-col items-end">
              <span className="text-white/60 uppercase tracking-widest text-xs">Score: <span className="text-[#ff4e00] font-bold text-sm ml-1">{score}</span></span>
              <a href="https://explorer-studio.genlayer.com/address/0x1D241e67Bdb32D50E5D3B12ADF4c9C1426B0e422" target="_blank" rel="noreferrer" className="text-[10px] text-[#ff4e00]/70 uppercase tracking-widest mt-0.5 hover:text-[#ff4e00] transition-colors underline decoration-[#ff4e00]/50 underline-offset-2 flex items-center gap-1">
                View Contract <Github className="w-3 h-3 hidden" />
              </a>
            </div>

            {walletAddress ? (
              <div className="flex items-center gap-2">
                {chainId !== '0xf22f' && (
                  <button 
                    onClick={switchNetwork}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Switch Network
                  </button>
                )}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/80 px-4 py-2 rounded-full text-xs font-mono tracking-wider">
                  <Wallet className="w-3.5 h-3.5 text-[#ff4e00]" />
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </div>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="flex items-center gap-2 bg-[#ff4e00] hover:bg-[#e04000] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-[0_0_20px_-5px_#ff4e00]"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <p className="text-[#ff4e00] font-mono text-xs uppercase tracking-[0.2em] mb-4 font-semibold">Chapter {levelIndex + 1}</p>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-white mb-6">
            The Oracle's <span className="italic opacity-80">Riddle</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto font-light">Describe the target word without triggering the taboo conditions. Formulate your incantation wisely.</p>
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-12">
          {/* Main Play Area */}
          <div className="space-y-8">
            {/* Target Word Card */}
            <motion.div 
              key={`target-${levelIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff4e00] to-transparent opacity-50" />
              <span className="invisible h-0 block">Target Word</span>
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 tracking-tight">
                {currentLevel.target}
              </h2>
            </motion.div>

            {/* Input Area */}
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 shadow-2xl relative">
              <label className="block text-xs font-medium text-white/50 mb-3 uppercase tracking-widest">Your Incantation</label>
              <textarea
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                disabled={gameState !== 'playing'}
                placeholder="Cast your spell here..."
                className="w-full h-36 bg-black/40 border border-white/10 rounded-2xl p-5 text-white placeholder-white/30 font-serif text-xl focus:outline-none focus:ring-1 focus:ring-[#ff4e00] focus:border-[#ff4e00] resize-none transition-all disabled:opacity-40"
              />
              
              <div className="mt-6 flex justify-between items-center">
                <span className="text-[10px] text-white/40 flex items-center gap-1.5 uppercase tracking-widest font-mono">
                  <TerminalSquare className="w-3.5 h-3.5" />
                  Node: gl.nondet.exec_prompt
                </span>
                
                {gameState === 'playing' && (
                  <button
                    onClick={handleSubmit}
                    disabled={!hint.trim()}
                    className="flex items-center gap-3 bg-white text-black hover:bg-neutral-200 disabled:bg-white/10 disabled:text-white/30 px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all disabled:shadow-none shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]"
                  >
                    Invoke Consensus
                    <Sparkles className="w-4 h-4 ml-1" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Taboo Words */}
            <div className="bg-[#1a0808]/40 backdrop-blur-xl border border-red-500/20 rounded-[32px] p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl pointer-events-none rounded-full" />
              <div className="flex items-center gap-3 text-red-400 mb-6 font-serif">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-xl italic">Taboo Words</h3>
              </div>
              <ul className="space-y-3 relative z-10">
                {currentLevel.taboo.map((word, i) => (
                  <li key={i} className="bg-red-500/5 border border-red-500/10 px-4 py-2.5 rounded-xl text-red-200/80 font-serif text-lg flex items-center justify-between">
                    {word}
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                  </li>
                ))}
              </ul>
              <p className="text-[11px] font-mono text-red-400/50 mt-6 uppercase tracking-wider leading-relaxed">
                Using any form of these words will cause a fatal execution revert in the consensus validation.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Result Overlays */}
      <AnimatePresence>
        {gameState !== 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0a0502]/90 backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 max-w-lg w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#ff4e00] to-transparent opacity-50" />

              {gameState === 'intro' && (
                <div className="py-2">
                  <div className="w-20 h-20 bg-[#ff4e00]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#ff4e00]/20 relative">
                     <div className="absolute inset-0 bg-[#ff4e00]/20 blur-xl rounded-full" />
                    <Sparkles className="w-10 h-10 text-[#ff4e00] z-10" />
                  </div>
                  <h3 className="font-serif text-4xl mb-6 font-bold text-white tracking-tight">The Alchemist's <span className="italic text-[#ff4e00] font-light">Trial</span></h3>
                  
                  <div className="space-y-5 text-white/70 text-left bg-white/5 p-8 rounded-2xl border border-white/5 font-serif text-lg leading-relaxed">
                    <p>
                      Welcome, Conjurer. Your task is to guide the <span className="text-white font-medium">Oracle AI</span> to guess the secret <strong className="text-[#ff4e00]">Target Word</strong>.
                    </p>
                    <p>
                      You must provide a single hint (an incantation) to describe it without explicitly naming it.
                    </p>
                    <div className="border-l-2 border-red-500/50 pl-5 py-2 mt-4 text-red-200/90 text-base bg-red-500/5 rounded-r-lg">
                      <strong>Beware:</strong> Every level has forbidden <span className="text-red-400">Taboo Words</span>. If you type the target word or any taboo word, the spell breaks and the transaction reverts.
                    </div>
                  </div>

                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-6 mb-8 font-mono">
                    Simulated GenLayer Smart Contract • gl.nondet.exec_prompt
                  </p>

                  <button 
                    onClick={() => setGameState('playing')}
                    className="w-full py-4 bg-[#ff4e00] hover:bg-[#e04000] text-white font-bold rounded-full transition-all shadow-[0_0_30px_-5px_rgba(255,78,0,0.5)] uppercase tracking-widest text-sm"
                  >
                    Accept Trial
                  </button>
                </div>
              )}

              {gameState === 'evaluating' && (
                <div className="py-8">
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-[#ff4e00]/20 animate-ping rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center bg-[#ff4e00]/10 border border-[#ff4e00]/30 rounded-full">
                      <Loader2 className="w-10 h-10 text-[#ff4e00] animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-serif text-white mb-3">Oracle is Pondering...</h3>
                  <p className="text-white/50 text-sm mb-6 font-mono tracking-wide uppercase">Verifying logic through consensus layer.</p>
                  
                  {walletAddress && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 max-w-sm mx-auto text-left flex gap-3">
                       <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                       <div>
                        <p className="text-amber-400 text-sm font-bold uppercase tracking-wider mb-1">Waiting for Wallet...</p>
                        <p className="text-amber-500/80 text-xs leading-relaxed">Check your extension icon or open this app in a new tab if it didn't pop up.</p>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {gameState === 'won' && (
                <div className="py-8">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 z-10" />
                  </div>
                  <h3 className="text-4xl font-serif text-white mb-4">Consensus <span className="italic text-emerald-400 font-light">Reached</span></h3>
                  <p className="text-white/70 mb-8 font-serif text-xl">The Oracle accurately deduced the word <strong className="text-emerald-400 text-2xl uppercase tracking-widest ml-1">{currentLevel.target}</strong>.</p>
                  
                  <div className="bg-white/5 rounded-2xl p-5 mb-8 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
                    <span className="text-[10px] uppercase tracking-widest text-emerald-400/80 block mb-2 font-mono">Reward Executed</span>
                    <span className="text-lg text-white block mb-4 font-serif">+100 Experience</span>
                    
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 text-left">
                       <span className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Receipt Hash</span>
                       <span className="font-mono text-emerald-400 text-xs break-all block">
                         {txHash ? txHash : "Simulated Local Resolution (No TX)"}
                       </span>
                    </div>
                  </div>

                  <button 
                    onClick={handleNextLevel}
                    className="w-full py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-colors uppercase tracking-widest text-sm"
                  >
                    Proceed to Next Trial
                  </button>
                </div>
              )}

              {gameState === 'incorrect' && (
                <div className="py-8">
                  <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20 relative">
                     <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full" />
                    <XCircle className="w-10 h-10 text-orange-400 z-10" />
                  </div>
                  <h3 className="text-4xl font-serif text-white mb-4">Oracle <span className="italic text-orange-400 font-light">Confused</span></h3>
                  <p className="text-white/70 mb-8 font-serif text-lg leading-relaxed">{errorMsg}</p>

                  <button 
                    onClick={handleRetry}
                    className="w-full py-4 bg-white/5 text-white font-bold rounded-full hover:bg-white/10 border border-white/10 transition-colors uppercase tracking-widest text-sm"
                  >
                    Reformulate Incantation
                  </button>
                </div>
              )}

              {gameState === 'lost' && (
                <div className="py-8">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                    <XCircle className="w-10 h-10 text-red-400 z-10" />
                  </div>
                  <h3 className="text-4xl font-serif text-white mb-4">Spell <span className="italic text-red-400 font-light">Shattered</span></h3>
                  
                  <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10 mb-8">
                    <p className="text-red-200/90 font-serif text-lg leading-relaxed">{errorMsg}</p>
                    <p className="text-[10px] text-red-400/50 uppercase tracking-widest font-mono mt-4">Transaction Reverted</p>
                  </div>

                  <button 
                    onClick={handleRetry}
                    className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-full border border-red-500/20 transition-colors uppercase tracking-widest text-sm"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
