import React, { useState, useEffect } from 'react';
import { Flame, Pizza, Clock, Trophy, Wallet } from 'lucide-react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x01cac31f6876691e289e3944a3c7e594a21fc9e7';
const CONTRACT_ABI = [
  "function checkIn() external",
  "function getBakerInfo(address _baker) external view returns (uint256 pizzaProgress, uint256 lastCheckIn, uint256 totalPizzas, uint256 points, uint256 timeUntilNextCheckIn)",
  "function canCheckInNow(address _baker) external view returns (bool)",
  "event CheckedIn(address indexed baker, uint256 progress, uint256 timestamp)",
  "event PizzaBaked(address indexed baker, uint256 totalPizzas, uint256 points)"
];

const PizzaBakeryDapp = () => {
  const [account, setAccount] = useState(null);
  const [pizzaProgress, setPizzaProgress] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [totalPizzas, setTotalPizzas] = useState(0);
  const [points, setPoints] = useState(0);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWalletConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (account && contract) {
      loadUserData();
      const interval = setInterval(loadUserData, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, contract]);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await setupContract(accounts[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const setupContract = async (addr) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);
      setAccount(addr);
    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== '0x2105') {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2105' }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x2105',
                  chainName: 'Base',
                  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org']
                }]
              });
            }
          }
        }
        await setupContract(accounts[0]);
      } catch (err) {
        console.error(err);
      }
    } else {
      alert('You need a wallet like MetaMask or Rabby to use this app.');
    }
  };

  const loadUserData = async () => {
    if (!contract || !account) return;
    try {
      const info = await contract.getBakerInfo(account);
      setPizzaProgress(Number(info[0]));
      setLastCheckIn(Number(info[1]) * 1000);
      setTotalPizzas(Number(info[2]));
      setPoints(Number(info[3]));
      
      const timeLeftSec = Number(info[4]);
      setTimeLeft(timeLeftSec);
      setCanCheckIn(timeLeftSec === 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async () => {
    if (!contract || !canCheckIn) return;
    setLoading(true);
    try {
      const tx = await contract.checkIn();
      await tx.wait();
      await loadUserData();
    } catch (err) {
      console.error(err);
      alert('Check-in failed — maybe it’s too early?');
    }
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-xl p-12 rounded-3xl border border-orange-500/30 text-center max-w-md">
          <Pizza className="w-24 h-24 mx-auto mb-6 text-orange-400 animate-pulse" />
          <h1 className="text-5xl font-black text-orange-300 mb-4">Pizza Bakery</h1>
          <p className="text-orange-200/70 mb-8 text-lg">
            Check in every 15 minutes<br/>4 check-ins = 1 pizza<br/>Earn points<br/>Become a legend
          </p>
          <button 
            onClick={connectWallet}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 flex items-center gap-3 mx-auto text-lg shadow-2xl"
          >
            <Wallet className="w-6 h-6" />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-orange-500/30 p-8 mb-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Pizza className="w-12 h-12 text-orange-400" />
              <div>
                <h1 className="text-4xl font-black text-orange-300">Pizza Bakery</h1>
                <p className="text-orange-200/50 text-sm font-mono">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-3xl font-black text-yellow-300">{points}</span>
              </div>
              <p className="text-yellow-200/50 text-sm">Points</p>
            </div>
          </div>

          <div className="bg-black/30 rounded-2xl p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-orange-200 text-xl font-bold">Pizza Progress</span>
              <span className="text-orange-300 text-2xl font-black">{pizzaProgress}/4</span>
            </div>
            
            <div className="relative h-8 bg-black/50 rounded-full overflow-hidden mb-6">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 rounded-full"
                style={{ width: `${(pizzaProgress / 4) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {pizzaProgress === 4 ? 'Pizza ready!' : `${4 - pizzaProgress} check-ins left`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    i < pizzaProgress 
                      ? 'bg-gradient-to-br from-orange-500 to-red-500 scale-100' 
                      : 'bg-black/50 scale-95'
                  }`}
                >
                  {i < pizzaProgress && <Flame className="w-8 h-8 text-white" />}
                </div>
              ))}
            </div>

            {lastCheckIn > 0 && (
              <div className="flex items-center justify-center gap-3 mb-4 text-orange-200">
                <Clock className="w-5 h-5" />
                <span className="text-lg">
                  {canCheckIn ? 'You can check in now!' : `Next check-in in ${formatTime(timeLeft)}`}
                </span>
              </div>
            )}

            <button
              onClick={handleCheckIn}
              disabled={!canCheckIn || loading}
              className={`w-full py-4 rounded-xl font-black text-xl transition-all transform ${
                canCheckIn && !loading
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white hover:scale-105 shadow-2xl'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Baking...' : !lastCheckIn ? 'Start Baking' : canCheckIn ? 'Check In' : 'Too Early'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30">
              <Pizza className="w-8 h-8 text-orange-400 mb-2" />
              <div className="text-4xl font-black text-orange-300 mb-1">{totalPizzas}</div>
              <div className="text-orange-200/70 text-sm">Total Pizzas</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
              <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
              <div className="text-4xl font-black text-yellow-300 mb-1">{Math.floor(points / 100)}</div>
              <div className="text-yellow-200/70 text-sm">Level</div>
            </div>
          </div>
        </div>

        <div className="text-center text-orange-200/50 text-sm">
          <p>Check in every 15 minutes • 4 check-ins = 1 pizza • Earn points</p>
          <p className="mt-2">Contract: {CONTRACT_ADDRESS}</p>
        </div>
      </div>
    </div>
  );
};

export default PizzaBakeryDapp;
