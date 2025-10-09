// Telegram WebApp Initialization
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHofuS76xf2oGPaJqEtopmcxdoJzjkDL4",
  authDomain: "zmex-investments.firebaseapp.com",
  databaseURL: "https://zmex-investments-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zmex-investments",
  storageBucket: "zmex-investments.appspot.com",
  messagingSenderId: "971623941364",
  appId: "1:971623941364:web:6c65604fc45c3f64e74aa1",
  measurementId: "G-KQ1LYP77JF"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Global State
let userId = null;
let userName = null;
let userAvatar = null;
let userData = null;
let energyTimer = null;
let incomeTimer = null;
let balanceListener = null;
let adStats = { 
  today: 0, 
  yesterday: 0, 
  thisWeek: 0, 
  thisMonth: 0, 
  lifetime: 0,
  lastAdDate: null,
  lastWeekReset: null,
  lastMonthReset: null
};
let booster = {
  energy: 1200,
  maxEnergy: 1200,
  multiTap: 1,
  incomeBooster: false,
  multiTapCount: 0,
  maxEnergyUpCount: 0
};
let coinsEarned = 0;
let adLoading = false;
let profileSections = [];
let rankingListener = null;
let referralCount = 0;
let referralListener = null;
let pendingTaskRewards = {};
let totalReferralCommission = 0;
let lastActivityTime = null;
let incomeActive = true;
let activityCheckTimer = null;
const ACTIVITY_TIMEOUT = 3 * 60 * 60;

// Trading State
let tradingBalance = 0;
let activePlans = [];
let cryptoPrices = {};
let priceUpdateInterval = null;
let depositTimer = null;
let depositTimerInterval = null;

// Crypto pairs for trading
const tradingPairs = [
  { pair: 'BTC/USDT', price: 95000, dailyEarning: 300, duration: 30, minInvest: 3000, gradient: 'linear-gradient(135deg, #f7931a 0%, #ff9500 100%)' },
  { pair: 'ETH/USDT', price: 3500, dailyEarning: 200, duration: 30, minInvest: 2000, gradient: 'linear-gradient(135deg, #627eea 0%, #8c9eff 100%)' },
  { pair: 'BNB/USDT', price: 650, dailyEarning: 150, duration: 30, minInvest: 1500, gradient: 'linear-gradient(135deg, #f3ba2f 0%, #ffd700 100%)' },
  { pair: 'SOL/USDT', price: 180, dailyEarning: 120, duration: 30, minInvest: 1200, gradient: 'linear-gradient(135deg, #00d4aa 0%, #14f195 100%)' },
  { pair: 'XRP/USDT', price: 2.5, dailyEarning: 100, duration: 30, minInvest: 1000, gradient: 'linear-gradient(135deg, #23292f 0%, #346aa9 100%)' },
  { pair: 'ADA/USDT', price: 1.2, dailyEarning: 90, duration: 30, minInvest: 900, gradient: 'linear-gradient(135deg, #0033ad 0%, #3468c0 100%)' },
  { pair: 'DOGE/USDT', price: 0.35, dailyEarning: 80, duration: 30, minInvest: 800, gradient: 'linear-gradient(135deg, #c2a633 0%, #f0d000 100%)' },
  { pair: 'AVAX/USDT', price: 45, dailyEarning: 110, duration: 30, minInvest: 1100, gradient: 'linear-gradient(135deg, #e84142 0%, #ff6b6b 100%)' },
  { pair: 'DOT/USDT', price: 8.5, dailyEarning: 95, duration: 30, minInvest: 950, gradient: 'linear-gradient(135deg, #e6007a 0%, #ff1493 100%)' },
  { pair: 'MATIC/USDT', price: 1.1, dailyEarning: 85, duration: 30, minInvest: 850, gradient: 'linear-gradient(135deg, #8247e5 0%, #a855f7 100%)' },
  { pair: 'LINK/USDT', price: 18, dailyEarning: 105, duration: 30, minInvest: 1050, gradient: 'linear-gradient(135deg, #2a5ada 0%, #375bd2 100%)' },
  { pair: 'UNI/USDT', price: 12, dailyEarning: 92, duration: 30, minInvest: 920, gradient: 'linear-gradient(135deg, #ff007a 0%, #ff4d9f 100%)' },
  { pair: 'LTC/USDT', price: 105, dailyEarning: 88, duration: 30, minInvest: 880, gradient: 'linear-gradient(135deg, #345d9d 0%, #5b8dc7 100%)' },
  { pair: 'ATOM/USDT', price: 11, dailyEarning: 87, duration: 30, minInvest: 870, gradient: 'linear-gradient(135deg, #2e3148 0%, #6f7390 100%)' },
  { pair: 'TRX/USDT', price: 0.25, dailyEarning: 75, duration: 30, minInvest: 750, gradient: 'linear-gradient(135deg, #ef0027 0%, #ff4d6d 100%)' },
  { pair: 'APT/USDT', price: 14, dailyEarning: 98, duration: 30, minInvest: 980, gradient: 'linear-gradient(135deg, #00d4aa 0%, #14f195 100%)' },
  { pair: 'ARB/USDT', price: 2.2, dailyEarning: 82, duration: 30, minInvest: 820, gradient: 'linear-gradient(135deg, #28a0f0 0%, #4fc3f7 100%)' },
  { pair: 'OP/USDT', price: 3.8, dailyEarning: 84, duration: 30, minInvest: 840, gradient: 'linear-gradient(135deg, #ff0420 0%, #ff4d6d 100%)' },
  { pair: 'FIL/USDT', price: 6.5, dailyEarning: 78, duration: 30, minInvest: 780, gradient: 'linear-gradient(135deg, #0090ff 0%, #42a5f5 100%)' },
  { pair: 'NEAR/USDT', price: 5.2, dailyEarning: 76, duration: 30, minInvest: 760, gradient: 'linear-gradient(135deg, #00c08b 0%, #00e5a0 100%)' },
  { pair: 'ICP/USDT', price: 13, dailyEarning: 93, duration: 30, minInvest: 930, gradient: 'linear-gradient(135deg, #29abe2 0%, #5bc5f2 100%)' },
  { pair: 'SHIB/USDT', price: 0.000028, dailyEarning: 70, duration: 30, minInvest: 700, gradient: 'linear-gradient(135deg, #ffa409 0%, #ffb84d 100%)' },
  { pair: 'TON/USDT', price: 5.8, dailyEarning: 115, duration: 30, minInvest: 1150, gradient: 'linear-gradient(135deg, #0088cc 0%, #00a8e8 100%)' },
  { pair: 'PEPE/USDT', price: 0.0000018, dailyEarning: 65, duration: 30, minInvest: 650, gradient: 'linear-gradient(135deg, #00a86b 0%, #00c781 100%)' }
];

// Utility Functions
function now() {
  return Math.floor(Date.now() / 1000);
}

function getToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekStart() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getMonthStart() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function updateLoadingProgress(text) {
  const progressEl = document.getElementById('loadingProgress');
  if (progressEl) {
    progressEl.textContent = text;
  }
}

function notify(message, duration = 2500) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, duration);
}

function generateUserMemo() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `shark${randomNum}`;
}

// [CONTINUE WITH REST OF FUNCTIONS...]
