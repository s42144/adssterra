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

// Trading State
let tradingData = {
  usdtBalance: 0,
  tonBalance: 0,
  activeTrades: [],
  depositHistory: [],
  withdrawHistory: [],
  tradeHistory: []
};

let cryptoPrices = {};
let priceUpdateInterval = null;
let depositTimer = null;
let depositTimerInterval = null;

// Passive Income Activity Tracking
let lastActivityTime = null;
let incomeActive = true;
let activityCheckTimer = null;
const ACTIVITY_TIMEOUT = 3 * 60 * 60; // 3 hours in seconds

// Trading Plans Configuration
const tradingPlans = [
  { pair: 'BTC/USDT', price: 3000, dailyEarning: 300, duration: 30, minInvest: 40 },
  { pair: 'ETH/USDT', price: 2000, dailyEarning: 200, duration: 30, minInvest: 40 },
  { pair: 'BNB/USDT', price: 1500, dailyEarning: 150, duration: 30, minInvest: 40 },
  { pair: 'SOL/USDT', price: 1200, dailyEarning: 120, duration: 30, minInvest: 40 },
  { pair: 'ADA/USDT', price: 1000, dailyEarning: 100, duration: 30, minInvest: 40 },
  { pair: 'XRP/USDT', price: 900, dailyEarning: 90, duration: 30, minInvest: 40 },
  { pair: 'DOT/USDT', price: 800, dailyEarning: 80, duration: 30, minInvest: 40 },
  { pair: 'DOGE/USDT', price: 700, dailyEarning: 70, duration: 30, minInvest: 40 },
  { pair: 'AVAX/USDT', price: 650, dailyEarning: 65, duration: 30, minInvest: 40 },
  { pair: 'MATIC/USDT', price: 600, dailyEarning: 60, duration: 30, minInvest: 40 },
  { pair: 'LINK/USDT', price: 550, dailyEarning: 55, duration: 30, minInvest: 40 },
  { pair: 'UNI/USDT', price: 500, dailyEarning: 50, duration: 30, minInvest: 40 },
  { pair: 'ATOM/USDT', price: 450, dailyEarning: 45, duration: 30, minInvest: 40 },
  { pair: 'LTC/USDT', price: 400, dailyEarning: 40, duration: 30, minInvest: 40 },
  { pair: 'TRX/USDT', price: 350, dailyEarning: 35, duration: 30, minInvest: 40 },
  { pair: 'XLM/USDT', price: 300, dailyEarning: 30, duration: 30, minInvest: 40 },
  { pair: 'ALGO/USDT', price: 280, dailyEarning: 28, duration: 30, minInvest: 40 },
  { pair: 'VET/USDT', price: 250, dailyEarning: 25, duration: 30, minInvest: 40 },
  { pair: 'FIL/USDT', price: 220, dailyEarning: 22, duration: 30, minInvest: 40 },
  { pair: 'NEAR/USDT', price: 200, dailyEarning: 20, duration: 30, minInvest: 40 }
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

function getTelegramUserData() {
  updateLoadingProgress('Getting Telegram user data...');
  
  const user = tg.initDataUnsafe?.user;
  
  if (user && user.id) {
    userId = user.id.toString();
    userName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    
    if (user.photo_url) {
      userAvatar = user.photo_url;
    } else {
      userAvatar = "https://github.com/akhterefti-del/Shark/blob/76091d5ce35c6707100f0269223352d0b5c1a163/Gemini_Generated_Image_ad2lr0ad2lr0ad2l.png?raw=true";
    }
    
    console.log('Telegram User ID:', userId);
    console.log('Telegram User Name:', userName);
    return true;
  }
  
  console.warn('Running outside Telegram environment - using test user');
  userId = 'test_' + Math.floor(10000 + Math.random() * 89999).toString();
  userName = 'Test User';
  userAvatar = "https://github.com/akhterefti-del/Shark/blob/76091d5ce35c6707100f0269223352d0b5c1a163/Gemini_Generated_Image_ad2lr0ad2lr0ad2l.png?raw=true";
  return true;
}

// Update Activity Timestamp
function updateActivity() {
  lastActivityTime = now();
  
  if (userId) {
    db.ref('users/' + userId).update({
      lastActivityTime: lastActivityTime
    });
  }
  
  if (booster.incomeBooster && !incomeActive) {
    incomeActive = true;
    notify('✅ Passive income resumed! Welcome back!', 3000);
    setupIncomeBooster();
    
    const activeTab = document.querySelector('.nav-btn.active');
    if (activeTab && activeTab.dataset.tab === 'home') {
      renderHome();
    }
  }
}

// Check Activity Status
function checkActivityStatus() {
  if (!booster.incomeBooster) return true;
  
  const currentTime = now();
  const timeSinceActivity = currentTime - lastActivityTime;
  
  if (timeSinceActivity >= ACTIVITY_TIMEOUT) {
    if (incomeActive) {
      incomeActive = false;
      
      if (incomeTimer) {
        clearInterval(incomeTimer);
        incomeTimer = null;
      }
      
      notify('⚠️ Passive income paused! Please be online every 3 hours.', 4000);
      
      const activeTab = document.querySelector('.nav-btn.active');
      if (activeTab && activeTab.dataset.tab === 'home') {
        renderHome();
      }
    }
    return false;
  }
  
  return true;
}

// Setup Activity Monitoring
function setupActivityMonitoring() {
  document.addEventListener('click', updateActivity);
  document.addEventListener('touchstart', updateActivity);
  document.addEventListener('keydown', updateActivity);
  
  if (activityCheckTimer) clearInterval(activityCheckTimer);
  activityCheckTimer = setInterval(checkActivityStatus, 60000);
}

// Referral Commission Function
function awardReferralCommission(earnedAmount) {
  if (!userData.referredBy) {
    console.log('No referrer for this user');
    return;
  }
  
  const commission = Math.floor(earnedAmount * 0.2);
  const referrerId = userData.referredBy;
  
  console.log(`Awarding ${commission} SHB commission to referrer ${referrerId} for ${earnedAmount} SHB earned`);
  
  const referrerBalanceRef = db.ref('users/' + referrerId + '/balance');
  const referrerCommissionRef = db.ref('users/' + referrerId + '/referralCommissions/' + userId);
  const referrerTotalCommissionRef = db.ref('users/' + referrerId + '/totalReferralCommission');
  
  referrerBalanceRef.transaction((currentBalance) => {
    return (currentBalance || 0) + commission;
  }).then(() => {
    console.log(`Referrer balance updated successfully`);
    
    referrerCommissionRef.transaction((currentCommission) => {
      return (currentCommission || 0) + commission;
    });
    
    referrerTotalCommissionRef.transaction((totalCommission) => {
      return (totalCommission || 0) + commission;
    });
    
    db.ref('users/' + referrerId).update({
      lastUpdated: now()
    });
    
    db.ref('admin/commissionLog').push({
      referrerId: referrerId,
      referredUserId: userId,
      amount: commission,
      earnedAmount: earnedAmount,
      timestamp: now(),
      type: 'ad_earning'
    });
  }).catch((error) => {
    console.error('Error awarding commission:', error);
  });
}

function showReferralWelcome(referrerId) {
  return new Promise((resolve) => {
    db.ref('users/' + referrerId).once('value').then(snap => {
      if (snap.exists()) {
        const referrerData = snap.val();
        
        document.getElementById('referrerAvatar').src = referrerData.avatar || userAvatar;
        document.getElementById('referrerName').textContent = referrerData.name || 'Unknown';
        document.getElementById('referrerId').textContent = 'ID: ' + referrerId;
        
        document.getElementById('referral-welcome').style.display = 'flex';
        
        let countdown = 5;
        const countdownEl = document.getElementById('welcomeCountdown');
        
        const countdownInterval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            countdownEl.textContent = `Starting in ${countdown} seconds...`;
          } else {
            clearInterval(countdownInterval);
            document.getElementById('referral-welcome').style.display = 'none';
            resolve();
          }
        }, 1000);
      } else {
        resolve();
      }
    });
  });
}

function processReferral() {
  return new Promise((resolve) => {
    updateLoadingProgress('Processing referral...');
    
    const startParam = tg.initDataUnsafe?.start_param;
    console.log('Start Param:', startParam);
    
    if (startParam) {
      let referrerId = startParam;
      
      console.log('Referrer ID:', referrerId);
      console.log('Current User ID:', userId);
      
      if (referrerId && referrerId !== userId) {
        db.ref('users/' + userId + '/referredBy').once('value').then(snap => {
          if (!snap.exists()) {
            console.log('Processing new referral...');
            
            db.ref('users/' + referrerId).once('value').then(refSnap => {
              if (refSnap.exists()) {
                console.log('Referrer found in database');
                
                showReferralWelcome(referrerId).then(() => {
                  const referrerData = refSnap.val();
                  const newBalance = (referrerData.balance || 0) + 5000;
                  
                  db.ref('users/' + referrerId).update({
                    balance: newBalance,
                    lastUpdated: now()
                  }).then(() => {
                    console.log('Referrer balance updated to:', newBalance);
                  });
                  
                  db.ref('users/' + userId).update({
                    referredBy: referrerId,
                    referredAt: now()
                  }).then(() => {
                    console.log('Referral link saved for user');
                    
                    db.ref('admin/notifications').push({
                      type: 'new_referral',
                      referrerId: referrerId,
                      referrerName: referrerData.name || 'Unknown',
                      newUserId: userId,
                      newUserName: userName,
                      timestamp: now(),
                      reward: 5000
                    });
                    
                    notify('Welcome! Your referrer earned 5000 SHB!', 3000);
                    resolve();
                  });
                });
              } else {
                console.log('Referrer not found in database');
                resolve();
              }
            });
          } else {
            console.log('User was already referred by:', snap.val());
            resolve();
          }
        });
      } else {
        resolve();
      }
    } else {
      console.log('No referral parameter found');
      resolve();
    }
  });
}

function saveLastSeenData() {
  if (userData) {
    db.ref('users/' + userId).update({
      lastSeen: now(),
      lastBalance: coinsEarned,
      lastEnergy: booster.energy,
      lastActivityTime: lastActivityTime
    });
  }
}

window.addEventListener('beforeunload', saveLastSeenData);
window.addEventListener('unload', saveLastSeenData);

setInterval(saveLastSeenData, 30000);

function getOfflineTime(snap) {
  const lastSeen = snap.val() && snap.val().lastSeen;
  if (!lastSeen) return 0;
  const timeDiff = now() - lastSeen;
  return timeDiff > 0 ? timeDiff : 0;
}

function resetAdStatsIfNeeded() {
  const today = getToday();
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();
  
  if (adStats.lastAdDate !== today) {
    adStats.yesterday = adStats.today;
    adStats.today = 0;
    adStats.lastAdDate = today;
  }
  
  if (adStats.lastWeekReset !== weekStart) {
    adStats.thisWeek = 0;
    adStats.lastWeekReset = weekStart;
  }
  
  if (adStats.lastMonthReset !== monthStart) {
    adStats.thisMonth = 0;
    adStats.lastMonthReset = monthStart;
  }
}

function setupReferralListener() {
  if (referralListener) {
    referralListener.off();
  }
  
  referralListener = db.ref('users')
    .orderByChild('referredBy')
    .equalTo(userId);
  
  referralListener.on('value', (snapshot) => {
    const count = snapshot.numChildren();
    referralCount = count;
    
    let totalCommission = 0;
    snapshot.forEach(child => {
      const referredUser = child.val();
      if (userData.referralCommissions && userData.referralCommissions[child.key]) {
        totalCommission += userData.referralCommissions[child.key];
      }
    });
    totalReferralCommission = totalCommission;
    
    const referralValueEl = document.querySelector('.referral-stat-value');
    const referralEarningsEl = document.querySelectorAll('.referral-stat-value')[1];
    
    if (referralValueEl) {
      referralValueEl.textContent = count;
    }
    if (referralEarningsEl) {
      const signupBonus = count * 5000;
      referralEarningsEl.textContent = signupBonus + totalCommission;
    }
    
    console.log('Real-time referral count updated:', count);
    console.log('Total referral commission:', totalCommission);
  });
}

function setupBalanceListener() {
  if (balanceListener) {
    balanceListener.off();
  }
  
  balanceListener = db.ref('users/' + userId + '/balance');
  
  balanceListener.on('value', (snapshot) => {
    const newBalance = snapshot.val();
    if (newBalance !== null && newBalance !== coinsEarned) {
      console.log('Balance updated from Firebase:', newBalance);
      coinsEarned = newBalance;
      
      const balanceEl = document.getElementById('homeBalance');
      if (balanceEl) {
        balanceEl.textContent = coinsEarned;
      }
    }
  });
}

function getMilestoneStatus(lifetimeAds) {
  const adsInCurrentCycle = lifetimeAds % 500;
  
  return {
    milestone100: adsInCurrentCycle >= 100,
    milestone200: adsInCurrentCycle >= 200,
    milestone500: adsInCurrentCycle >= 500
  };
}

function loadUserData() {
  updateLoadingProgress('Loading your data...');
  
  db.ref('users/' + userId).once('value').then(snap => {
    const offlineTime = getOfflineTime(snap);
    
    if (snap.exists()) {
      userData = snap.val();
      console.log('Existing user data loaded');
    } else {
      userData = {
        balance: 0,
        energy: 1200,
        maxEnergy: 1200,
        multiTap: 1,
        incomeBooster: false,
        multiTapCount: 0,
        maxEnergyUpCount: 0,
        ton: "",
        avatar: userAvatar,
        name: userName,
        referrals: 0,
        eject: 0,
        completedTasks: {},
        adStats: { 
          today: 0, 
          yesterday: 0, 
          thisWeek: 0, 
          thisMonth: 0, 
          lifetime: 0,
          lastAdDate: getToday(),
          lastWeekReset: getWeekStart(),
          lastMonthReset: getMonthStart()
        },
        milestones: {
          milestone100Claimed: false,
          milestone200Claimed: false,
          milestone500Claimed: false
        },
        referralCommissions: {},
        totalReferralCommission: 0,
        lastSeen: now(),
        lastBalance: 0,
        lastEnergy: 1200,
        lastActivityTime: now(),
        createdAt: now(),
        trading: {
          usdtBalance: 0,
          tonBalance: 0,
          activeTrades: {},
          depositHistory: {},
          withdrawHistory: {},
          tradeHistory: {}
        }
      };
      db.ref('users/' + userId).set(userData);
      console.log('New user created');
    }
    
    if (userData.name !== userName || userData.avatar !== userAvatar) {
      db.ref('users/' + userId).update({
        name: userName,
        avatar: userAvatar
      });
      userData.name = userName;
      userData.avatar = userAvatar;
    }
    
    let energy = userData.energy || 1200;
    const maxEnergy = userData.maxEnergy || 1200;
    const offlineEnergy = Math.min(energy + offlineTime * 0.5, maxEnergy);
    
    let balance = userData.balance || 0;
    const incomeBooster = userData.incomeBooster || false;
    
    lastActivityTime = userData.lastActivityTime || now();
    const timeSinceActivity = now() - lastActivityTime;
    
    if (incomeBooster) {
      if (timeSinceActivity < ACTIVITY_TIMEOUT) {
        const offlineIncome = Math.floor(offlineTime / 10);
        balance += offlineIncome;
        if (offlineIncome > 0) {
          notify(`Earned ${offlineIncome} SHB while offline!`);
        }
        incomeActive = true;
      } else {
        incomeActive = false;
        notify('⚠️ Passive income paused! Please be online every 3 hours.', 4000);
      }
    }
    
    userData.energy = Math.round(offlineEnergy);
    userData.balance = balance;
    coinsEarned = balance;
    booster.energy = userData.energy;
    booster.maxEnergy = userData.maxEnergy || 1200;
    booster.multiTap = userData.multiTap || 1;
    booster.incomeBooster = incomeBooster;
    booster.multiTapCount = userData.multiTapCount || 0;
    booster.maxEnergyUpCount = userData.maxEnergyUpCount || 0;
    
    if (userData.adStats) {
      adStats = {
        today: userData.adStats.today || 0,
        yesterday: userData.adStats.yesterday || 0,
        thisWeek: userData.adStats.thisWeek || 0,
        thisMonth: userData.adStats.thisMonth || 0,
        lifetime: userData.adStats.lifetime || 0,
        lastAdDate: userData.adStats.lastAdDate || getToday(),
        lastWeekReset: userData.adStats.lastWeekReset || getWeekStart(),
        lastMonthReset: userData.adStats.lastMonthReset || getMonthStart()
      };
    }
    
    if (!userData.milestones) {
      userData.milestones = {
        milestone100Claimed: false,
        milestone200Claimed: false,
        milestone500Claimed: false
      };
    }
    
    if (!userData.referralCommissions) {
      userData.referralCommissions = {};
    }
    if (!userData.totalReferralCommission) {
      userData.totalReferralCommission = 0;
    }
    totalReferralCommission = userData.totalReferralCommission;
    
    // Load trading data
    if (!userData.trading) {
      userData.trading = {
        usdtBalance: 0,
        tonBalance: 0,
        activeTrades: {},
        depositHistory: {},
        withdrawHistory: {},
        tradeHistory: {}
      };
    }
    
    tradingData = {
      usdtBalance: userData.trading.usdtBalance || 0,
      tonBalance: userData.trading.tonBalance || 0,
      activeTrades: userData.trading.activeTrades || {},
      depositHistory: userData.trading.depositHistory || {},
      withdrawHistory: userData.trading.withdrawHistory || {},
      tradeHistory: userData.trading.tradeHistory || {}
    };
    
    resetAdStatsIfNeeded();
    
    setupReferralListener();
    setupBalanceListener();
    setupActivityMonitoring();
    updateActivity();
    
    db.ref('users/' + userId).update({
      energy: userData.energy,
      balance: balance,
      lastSeen: now(),
      lastBalance: balance,
      lastEnergy: userData.energy,
      lastActivityTime: lastActivityTime,
      adStats: adStats
    });
    
    processReferral().then(() => {
      updateLoadingProgress('Starting app...');
      
      setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
      }, 1000);
      
      showTab('home');
      setupIncomeBooster();
      initializeCryptoPrices();
      setupTradingListeners();
    });
  });
}

function updateUserData(newData) {
  Object.assign(userData, newData);
  db.ref('users/' + userId).update(newData);
  
  if (newData.balance !== undefined) coinsEarned = newData.balance;
  if (newData.energy !== undefined) booster.energy = newData.energy;
  if (newData.maxEnergy !== undefined) booster.maxEnergy = newData.maxEnergy;
  if (newData.multiTap !== undefined) booster.multiTap = newData.multiTap;
  if (newData.incomeBooster !== undefined) booster.incomeBooster = newData.incomeBooster;
  if (newData.multiTapCount !== undefined) booster.multiTapCount = newData.multiTapCount;
  if (newData.maxEnergyUpCount !== undefined) booster.maxEnergyUpCount = newData.maxEnergyUpCount;
  if (newData.adStats !== undefined) adStats = newData.adStats;
  if (newData.referrals !== undefined) referralCount = newData.referrals;
}

function showTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  if (tab === 'home') renderHome();
  if (tab === 'booster') renderBooster();
  if (tab === 'earn') renderEarn();
  if (tab === 'profile') renderProfile();
  if (tab === 'ranking') renderRanking();
}

function renderHome() {
  const profit = booster.incomeBooster ? Math.floor(coinsEarned / 3600) : 0;
  
  let warningHTML = '';
  if (booster.incomeBooster) {
    const timeSinceActivity = now() - lastActivityTime;
    const timeRemaining = ACTIVITY_TIMEOUT - timeSinceActivity;
    
    if (!incomeActive) {
      warningHTML = `
        <div class="income-status-warning">
          <div class="income-status-icon">⚠️</div>
          <div class="income-status-title">Passive Income Paused</div>
          <div class="income-status-message">
            You've been inactive for more than 3 hours. Your passive income has been paused. 
            Tap anywhere to resume earning!
          </div>
        </div>
      `;
    } else if (timeRemaining < 1800) {
      const minutesRemaining = Math.floor(timeRemaining / 60);
      warningHTML = `
        <div class="income-status-warning">
          <div class="income-status-icon">⏰</div>
          <div class="income-status-title">Activity Required Soon</div>
          <div class="income-status-message">
            Your passive income will pause in ${minutesRemaining} minutes. Stay active to keep earning!
          </div>
        </div>
      `;
    }
  }
  
  const html = `
    <div class="home-main">
      <div class="balance-card">
        <div class="balance-label">Your Balance</div>
        <div class="balance-amount" id="homeBalance">${coinsEarned}</div>
        <div class="balance-currency">SHB</div>
      </div>
      
      ${warningHTML}
      
      <div class="coin-container">
        <div class="coin-glow"></div>
        <img src="https://github.com/akhterefti-del/Shark/blob/eec9a5de183800435c0f781a44b5da5722479f20/sharkcoin.png?raw=true" 
             class="coin-image" 
             id="coinImage" 
             alt="Shark Coin" />
        <div class="tap-indicator" id="tapIndicator">+1</div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Energy</div>
          <div class="stat-value" id="energyValue">${Math.floor(booster.energy)}</div>
          <div class="stat-desc">/ ${booster.maxEnergy}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Multi-Tap</div>
          <div class="stat-value" id="multiTapValue">${booster.multiTap}</div>
          <div class="stat-desc">fingers</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Profit</div>
          <div class="stat-value" id="profitValue">${profit}</div>
          <div class="stat-desc">per hour</div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('main-content').innerHTML = html;
  setupCoinTapping();
  setupEnergyRecovery();
}

function setupCoinTapping() {
  const coin = document.getElementById('coinImage');
  const indicator = document.getElementById('tapIndicator');
  
  if (!coin) return;
  
  function handleTap(tapCount) {
    if (booster.energy < tapCount) {
      notify('Not enough energy!');
      indicator.textContent = 'Low Energy';
      indicator.classList.add('show');
      setTimeout(() => indicator.classList.remove('show'), 500);
      return;
    }
    
    booster.energy -= tapCount;
    coinsEarned += tapCount;
    
    updateUserData({
      balance: coinsEarned,
      energy: booster.energy
    });
    
    indicator.textContent = '+' + tapCount;
    indicator.classList.add('show');
    setTimeout(() => indicator.classList.remove('show'), 400);
    
    updateEnergyDisplay();
    document.getElementById('homeBalance').textContent = coinsEarned;
    
    updateActivity();
  }
  
  coin.addEventListener('click', (e) => {
    e.preventDefault();
    handleTap(booster.multiTap);
  });
  
  coin.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touches = e.touches.length;
    const tapCount = Math.min(touches, booster.multiTap);
    handleTap(tapCount);
  });
}

function updateEnergyDisplay() {
  const energyEl = document.getElementById('energyValue');
  if (energyEl) {
    energyEl.textContent = Math.floor(booster.energy);
  }
}

function updateStatsDisplay() {
  const multiTapEl = document.getElementById('multiTapValue');
  const profitEl = document.getElementById('profitValue');
  
  if (multiTapEl) multiTapEl.textContent = booster.multiTap;
  if (profitEl) {
    const profit = booster.incomeBooster ? Math.floor(coinsEarned / 3600) : 0;
    profitEl.textContent = profit;
  }
}

function setupEnergyRecovery() {
  if (energyTimer) clearInterval(energyTimer);
  
  energyTimer = setInterval(() => {
    if (booster.energy < booster.maxEnergy) {
      booster.energy += 0.5;
      booster.energy = Math.min(booster.energy, booster.maxEnergy);
      
      updateUserData({ energy: Math.round(booster.energy) });
      updateEnergyDisplay();
    }
  }, 1000);
}

function setupIncomeBooster() {
  if (incomeTimer) clearInterval(incomeTimer);
  
  if (booster.incomeBooster && incomeActive) {
    incomeTimer = setInterval(() => {
      if (checkActivityStatus()) {
        coinsEarned++;
        
        updateUserData({ balance: coinsEarned });
        
        const balanceEl = document.getElementById('homeBalance');
        if (balanceEl) balanceEl.textContent = coinsEarned;
        
        updateStatsDisplay();
      }
    }, 10000);
  }
}

function renderBooster() {
  const maxEnergyDisabled = (booster.maxEnergyUpCount || 0) >= 10;
  const multiTapDisabled = (booster.multiTapCount || 0) >= 3;
  const incomeDisabled = booster.incomeBooster;
  
  const html = `
    <div class="booster-main">
      <div class="section-header">
        <div class="section-title">Boosters</div>
        <div class="section-subtitle">Upgrade your earning power</div>
      </div>
      
      <div class="booster-card" style="background-image: url('https://github.com/akhterefti-del/Shark/blob/7799e462d86dda9a2cd8c175f882b9ed36892998/incomebtbt.png?raw=true');">
        <div class="booster-header">
          <div class="booster-icon">⚡</div>
          <div class="booster-info">
            <div class="booster-title">Max Energy</div>
            <div class="booster-price">10,000 SHB</div>
          </div>
        </div>
        <div class="booster-desc">
          Increase your maximum energy capacity by 500 points. More energy means more tapping power!
        </div>
        <div class="booster-progress">
          Remaining: ${10 - (booster.maxEnergyUpCount || 0)} / 10
        </div>
        <button class="btn-primary" id="buyEnergy" ${coinsEarned < 10000 || maxEnergyDisabled ? 'disabled' : ''}>
          ${maxEnergyDisabled ? 'Max Level' : 'Upgrade'}
        </button>
      </div>
      
      <div class="booster-card" style="background-image: url('https://github.com/akhterefti-del/Shark/blob/7799e462d86dda9a2cd8c175f882b9ed36892998/multitapbt.png?raw=true');">
        <div class="booster-header">
          <div class="booster-icon">👆</div>
          <div class="booster-info">
            <div class="booster-title">Multi-Tap</div>
            <div class="booster-price">15,000 SHB</div>
          </div>
        </div>
        <div class="booster-desc">
          Unlock multi-finger tapping! Each upgrade adds one more finger (up to 4 total).
        </div>
        <div class="booster-progress">
          Current: ${booster.multiTap} fingers | Remaining: ${3 - (booster.multiTapCount || 0)} / 3
        </div>
        <button class="btn-primary" id="buyMultiTap" ${coinsEarned < 15000 || multiTapDisabled ? 'disabled' : ''}>
          ${multiTapDisabled ? 'Max Level' : 'Upgrade'}
        </button>
      </div>
      
      <div class="booster-card" style="background-image: url('https://github.com/akhterefti-del/Shark/blob/7799e462d86dda9a2cd8c175f882b9ed36892998/incomebt.png?raw=true');">
        <div class="booster-header">
          <div class="booster-icon">💲</div>
          <div class="booster-info">
            <div class="booster-title">Passive Income</div>
            <div class="booster-price">100,000 SHB</div>
          </div>
        </div>
        <div class="booster-desc">
          Earn 1 SHB every 10 seconds automatically! ⚠️ Requires being online every 3 hours to keep earning.
        </div>
        <div class="booster-progress">
          ${incomeDisabled ? 'Active' : 'Not Purchased'}
        </div>
        <button class="btn-primary" id="buyIncome" ${coinsEarned < 100000 || incomeDisabled ? 'disabled' : ''}>
          ${incomeDisabled ? 'Activated' : 'Purchase'}
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('main-content').innerHTML = html;
  
  document.getElementById('buyEnergy').addEventListener('click', () => {
    if (coinsEarned < 10000 || maxEnergyDisabled) {
      notify('Cannot purchase this upgrade!');
      return;
    }
    
    coinsEarned -= 10000;
    booster.maxEnergy += 500;
    booster.energy = booster.maxEnergy;
    booster.maxEnergyUpCount = (booster.maxEnergyUpCount || 0) + 1;
    
    updateUserData({
      balance: coinsEarned,
      maxEnergy: booster.maxEnergy,
      energy: booster.maxEnergy,
      maxEnergyUpCount: booster.maxEnergyUpCount
    });
    
    notify('Max energy increased by 500!');
    renderBooster();
  });
  
  document.getElementById('buyMultiTap').addEventListener('click', () => {
    if (coinsEarned < 15000 || multiTapDisabled) {
      notify('Cannot purchase this upgrade!');
      return;
    }
    
    coinsEarned -= 15000;
    const nextTap = booster.multiTap === 1 ? 2 : (booster.multiTap === 2 ? 3 : 4);
    booster.multiTap = nextTap;
    booster.multiTapCount = (booster.multiTapCount || 0) + 1;
    
    updateUserData({
      balance: coinsEarned,
      multiTap: nextTap,
      multiTapCount: booster.multiTapCount
    });
    
    notify(`Multi-tap upgraded to ${nextTap} fingers!`);
    renderBooster();
    updateStatsDisplay();
  });
  
  document.getElementById('buyIncome').addEventListener('click', () => {
    if (coinsEarned < 100000 || incomeDisabled) {
      notify('Cannot purchase this upgrade!');
      return;
    }
    
    coinsEarned -= 100000;
    booster.incomeBooster = true;
    incomeActive = true;
    
    updateUserData({
      balance: coinsEarned,
      incomeBooster: true,
      lastActivityTime: now()
    });
    
    notify('Passive income activated! Remember to be online every 3 hours!', 4000);
    setupIncomeBooster();
    renderBooster();
    updateStatsDisplay();
  });
}

function renderEarn() {
  resetAdStatsIfNeeded();
  
  const lifetimeAds = adStats.lifetime;
  const adsInCurrentCycle = lifetimeAds % 500;
  
  const milestoneStatus = getMilestoneStatus(lifetimeAds);
  const milestone100Unlocked = milestoneStatus.milestone100;
  const milestone200Unlocked = milestoneStatus.milestone200;
  const milestone500Unlocked = milestoneStatus.milestone500;
  
  const milestone100Claimed = userData.milestones?.milestone100Claimed || false;
  const milestone200Claimed = userData.milestones?.milestone200Claimed || false;
  const milestone500Claimed = userData.milestones?.milestone500Claimed || false;
  
  const html = `
    <div class="earn-main">
      <div class="section-header">
        <div class="section-title">Earn More</div>
      </div>
      
      <div class="chart-card">
        <div class="chart-title">Ad Statistics</div>
        <canvas id="adChart" width="400" height="200"></canvas>
      </div>
      
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-box-label">Today</div>
          <div class="stat-box-value">${adStats.today || 0}</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-label">Yesterday</div>
          <div class="stat-box-value">${adStats.yesterday || 0}</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-label">This Week</div>
          <div class="stat-box-value">${adStats.thisWeek || 0}</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-label">This Month</div>
          <div class="stat-box-value">${adStats.thisMonth || 0}</div>
        </div>
      </div>
      
      <div class="ad-card">
        <div class="ad-title">Watch Advertisement</div>
        <div class="ad-reward">Earn 500 SHB per ad</div>
        <button class="btn-primary" id="showAdBtn">
          ${adLoading ? 'Loading...' : 'Watch Ad'}
        </button>
      </div>
      
      <div class="crypto-trading-card" id="cryptoTradingBtn">
        <div class="crypto-trading-icon">📈</div>
        <div class="crypto-trading-title">Crypto Trading</div>
        <div class="crypto-trading-subtitle">Trade cryptocurrencies and earn daily profits</div>
      </div>
      
      <div class="milestone-card">
        <div class="milestone-title">
          <span class="milestone-icon">🏆</span>
          <span>Milestone Rewards</span>
        </div>
        
        <div class="milestone-item ${milestone100Unlocked && !milestone100Claimed ? 'unlocked' : 'locked'}">
          <div class="milestone-info">
            <div class="milestone-target">100 Ads Milestone</div>
            <div class="milestone-reward">Reward: 5,000 SHB</div>
            <div class="milestone-progress">${adsInCurrentCycle}/100 ads in current cycle</div>
          </div>
          <button class="milestone-btn ${milestone100Unlocked && !milestone100Claimed ? 'unlocked' : ''}" 
                  id="claim100" 
                  ${!milestone100Unlocked || milestone100Claimed ? 'disabled' : ''}>
            ${milestone100Claimed ? 'Claimed' : (milestone100Unlocked ? 'Claim Now!' : 'Locked')}
          </button>
        </div>
        
        <div class="milestone-item ${milestone200Unlocked && !milestone200Claimed ? 'unlocked' : 'locked'}">
          <div class="milestone-info">
            <div class="milestone-target">200 Ads Milestone</div>
            <div class="milestone-reward">Reward: 10,000 SHB</div>
            <div class="milestone-progress">${adsInCurrentCycle}/200 ads in current cycle</div>
          </div>
          <button class="milestone-btn ${milestone200Unlocked && !milestone200Claimed ? 'unlocked' : ''}" 
                  id="claim200" 
                  ${!milestone200Unlocked || milestone200Claimed ? 'disabled' : ''}>
            ${milestone200Claimed ? 'Claimed' : (milestone200Unlocked ? 'Claim Now!' : 'Locked')}
          </button>
        </div>
        
        <div class="milestone-item ${milestone500Unlocked && !milestone500Claimed ? 'unlocked' : 'locked'}">
          <div class="milestone-info">
            <div class="milestone-target">500 Ads Milestone</div>
            <div class="milestone-reward">Reward: 20,000 SHB</div>
            <div class="milestone-progress">${adsInCurrentCycle}/500 ads in current cycle</div>
          </div>
          <button class="milestone-btn ${milestone500Unlocked && !milestone500Claimed ? 'unlocked' : ''}" 
                  id="claim500" 
                  ${!milestone500Unlocked || milestone500Claimed ? 'disabled' : ''}>
            ${milestone500Claimed ? 'Claimed' : (milestone500Unlocked ? 'Claim Now!' : 'Locked')}
          </button>
        </div>
      </div>
      
      <div id="tasksList"></div>
    </div>
  `;
  
  document.getElementById('main-content').innerHTML = html;
  
  document.getElementById('cryptoTradingBtn').addEventListener('click', () => {
    openCryptoTrading();
  });
  
  document.getElementById('showAdBtn').addEventListener('click', () => {
    if (adLoading) return;
    
    adLoading = true;
    document.getElementById('showAdBtn').textContent = 'Loading...';
    
    if (typeof show_9970324 === 'function') {
      show_9970324().then(() => {
        adLoading = false;
        document.getElementById('showAdBtn').textContent = 'Watch Ad';
        
        const adReward = 500;
        coinsEarned += adReward;
        
        awardReferralCommission(adReward);
        
        adStats.today++;
        adStats.thisWeek++;
        adStats.thisMonth++;
        adStats.lifetime++;
        adStats.lastAdDate = getToday();
        
        const newAdsInCycle = adStats.lifetime % 500;
        
        if (newAdsInCycle === 0 && adStats.lifetime > 0) {
          userData.milestones = {
            milestone100Claimed: false,
            milestone200Claimed: false,
            milestone500Claimed: false
          };
          
          notify('New milestone cycle started! All rewards reset!', 3000);
        }
        
        updateUserData({
          balance: coinsEarned,
          adStats: adStats,
          milestones: userData.milestones
        });
        
        notify('Earned 500 SHB for watching ad!');
        renderEarn();
      }).catch(() => {
        adLoading = false;
        document.getElementById('showAdBtn').textContent = 'Watch Ad';
        notify('Ad failed to load. Please try again.');
      });
    } else {
      adLoading = false;
      document.getElementById('showAdBtn').textContent = 'Watch Ad';
      notify('Ad service not available.');
    }
  });
  
  document.getElementById('claim100').addEventListener('click', () => {
    if (milestone100Unlocked && !milestone100Claimed) {
      coinsEarned += 5000;
      
      userData.milestones.milestone100Claimed = true;
      
      updateUserData({
        balance: coinsEarned,
        milestones: userData.milestones
      });
      
      notify('Claimed 5,000 SHB milestone reward!');
      renderEarn();
    }
  });
  
  document.getElementById('claim200').addEventListener('click', () => {
    if (milestone200Unlocked && !milestone200Claimed) {
      coinsEarned += 10000;
      
      userData.milestones.milestone200Claimed = true;
      
      updateUserData({
        balance: coinsEarned,
        milestones: userData.milestones
      });
      
      notify('Claimed 10,000 SHB milestone reward!');
      renderEarn();
    }
  });
  
  document.getElementById('claim500').addEventListener('click', () => {
    if (milestone500Unlocked && !milestone500Claimed) {
      coinsEarned += 20000;
      
      userData.milestones.milestone500Claimed = true;
      
      updateUserData({
        balance: coinsEarned,
        milestones: userData.milestones
      });
      
      notify('Claimed 20,000 SHB milestone reward!');
      
      setTimeout(() => {
        userData.milestones = {
          milestone100Claimed: false,
          milestone200Claimed: false,
          milestone500Claimed: false
        };
        
        updateUserData({
          milestones: userData.milestones
        });
        
        notify('Milestone cycle completed! Starting new cycle...', 3000);
        renderEarn();
      }, 2000);
    }
  });
  
  loadTasks();
  
  setTimeout(() => {
    const ctx = document.getElementById('adChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Today', 'Yesterday', 'This Week', 'This Month'],
        datasets: [{
          label: 'Ads Watched',
          data: [
            adStats.today || 0,
            adStats.yesterday || 0,
            adStats.thisWeek || 0,
            adStats.thisMonth || 0
          ],
          backgroundColor: [
            'rgba(79, 172, 254, 0.8)',
            'rgba(102, 126, 234, 0.8)',
            'rgba(118, 75, 162, 0.8)',
            'rgba(245, 87, 108, 0.8)'
          ],
          borderColor: [
            'rgba(79, 172, 254, 1)',
            'rgba(102, 126, 234, 1)',
            'rgba(118, 75, 162, 1)',
            'rgba(245, 87, 108, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }, 100);
}

function loadTasks() {
  db.ref('tasks').once('value').then(snap => {
    const tasks = snap.val() || {};
    let html = '';
    
    Object.keys(tasks).forEach(taskId => {
      const task = tasks[taskId];
      const completed = userData.completedTasks && userData.completedTasks[taskId];
      
      html += `
        <div class="task-card">
          <img src="${task.photo}" class="task-image" alt="${task.name}" />
          <div class="task-info">
            <div class="task-name">${task.name}</div>
            <div class="task-reward">+${task.amount} SHB</div>
          </div>
          <button class="task-btn ${completed ? 'completed' : ''}" data-task-id="${taskId}">
            ${completed ? 'Done' : 'Start'}
          </button>
        </div>
      `;
    });
    
    document.getElementById('tasksList').innerHTML = html;
    
    document.querySelectorAll('.task-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const taskId = this.dataset.taskId;
        const task = tasks[taskId];
        
        if (userData.completedTasks && userData.completedTasks[taskId]) {
          window.open(task.link, '_blank');
          return;
        }
        
        if (pendingTaskRewards[taskId]) {
          notify('Task reward is already being processed!');
          return;
        }
        
        this.disabled = true;
        this.textContent = 'Processing...';
        
        pendingTaskRewards[taskId] = true;
        
        window.open(task.link, '_blank');
        
        notify('Complete the task. Reward will be added in 10 seconds...', 3000);
        
        setTimeout(() => {
          if (userData.completedTasks && userData.completedTasks[taskId]) {
            delete pendingTaskRewards[taskId];
            return;
          }
          
          const taskAmount = parseInt(task.amount);
          coinsEarned += taskAmount;
          
          if (!userData.completedTasks) userData.completedTasks = {};
          userData.completedTasks[taskId] = true;
          
          updateUserData({
            balance: coinsEarned,
            completedTasks: userData.completedTasks
          });
          
          delete pendingTaskRewards[taskId];
          
          notify(`Earned ${task.amount} SHB!`);
          
          renderEarn();
        }, 10000);
      });
    });
  });
}

function showReferralList() {
  const modal = document.getElementById('referralModal');
  const content = document.getElementById('referralListContent');
  
  db.ref('users')
    .orderByChild('referredBy')
    .equalTo(userId)
    .once('value')
    .then(snapshot => {
      if (snapshot.numChildren() === 0) {
        content.innerHTML = '<div class="referral-list-empty">You haven\'t referred anyone yet. Share your referral link to start earning!</div>';
      } else {
        let html = '';
        snapshot.forEach(child => {
          const referredUser = child.val();
          const referredUserId = child.key;
          
          const commissionFromUser = userData.referralCommissions && userData.referralCommissions[referredUserId] 
            ? userData.referralCommissions[referredUserId] 
            : 0;
          
          html += `
            <div class="referral-list-item">
              <img src="${referredUser.avatar || userAvatar}" class="referral-list-avatar" alt="${referredUser.name}" />
              <div class="referral-list-info">
                <div class="referral-list-name">${referredUser.name || 'Unknown'}</div>
                <div class="referral-list-id">ID: ${referredUserId}</div>
                <div class="referral-list-balance">${referredUser.balance || 0} SHB</div>
                <div class="referral-commission">💰 Commission: ${commissionFromUser} SHB</div>
              </div>
            </div>
          `;
        });
        content.innerHTML = html;
      }
      
      modal.style.display = 'flex';
    });
}

function renderProfile() {
  loadProfileSections().then(() => {
    let sectionsHTML = '';
    profileSections.forEach(section => {
      sectionsHTML += `
        <div class="section-link-card" onclick="window.open('${section.link}', '_blank')">
          <img src="${section.image}" class="section-link-image" alt="${section.name}" />
          <div class="section-link-title">${section.name}</div>
        </div>
      `;
    });
    
    const html = `
      <div class="profile-main">
        <div class="profile-header">
          <div class="avatar-container">
            <div class="avatar-glow"></div>
            <img src="${userData.avatar}" class="avatar-image" alt="Avatar" />
          </div>
          <div class="user-info-box">
            <div class="user-name">${userData.name}</div>
            <div class="user-id-row">
              <span class="user-id-label">ID:</span>
              <span class="user-id-value">${userId}</span>
              <img src="https://github.com/akhterefti-del/Shark/blob/414f316d45b382764893e66646e983d101310c2e/Gemini_Generated_Image_c5nuk1c5nuk1c5nu.png?raw=true" 
                   class="copy-icon" 
                   id="copyUserId" 
                   alt="Copy" />
            </div>
          </div>
        </div>
        
        <div class="profile-card">
          <div class="card-title">TON Wallet</div>
          <div class="wallet-input-group">
            <input type="text" 
                   class="input-field" 
                   id="tonWallet" 
                   placeholder="Enter your TON wallet address" 
                   value="${userData.ton || ''}" />
            <button class="btn-secondary" id="saveTonWallet">Save</button>
          </div>
        </div>
        
        <div class="profile-card">
          <div class="card-title">Referral Program</div>
          <div class="referral-link-box">
            <span class="referral-link" id="referralLink">https://t.me/SharkBountybot/myapp?startapp=${userId}</span>
            <img src="https://github.com/akhterefti-del/Shark/blob/414f316d45b382764893e66646e983d101310c2e/Gemini_Generated_Image_c5nuk1c5nuk1c5nu.png?raw=true" 
                 class="copy-icon" 
                 id="copyReferralLink" 
                 alt="Copy" />
          </div>
          <div class="referral-stats">
            <div class="referral-stat">
              <div class="referral-stat-label">Total Referrals</div>
              <div class="referral-stat-value">${referralCount}</div>
            </div>
            <div class="referral-stat">
              <div class="referral-stat-label">Total Earnings</div>
              <div class="referral-stat-value">${(referralCount * 5000) + totalReferralCommission}</div>
            </div>
          </div>
          <button class="btn-view-referrals" id="viewReferralsBtn">View My Referrals</button>
        </div>
        
        ${sectionsHTML}
        
        <div class="profile-card">
          <div class="card-title">Redeem Code</div>
          <div class="redeem-form-group">
            <input type="text" 
                   class="redeem-input" 
                   id="redeemCode" 
                   placeholder="Enter 4-digit code" 
                   maxlength="4" />
            <button class="btn-secondary" id="redeemBtn">Redeem</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('main-content').innerHTML = html;
    
    document.getElementById('copyUserId').addEventListener('click', () => {
      navigator.clipboard.writeText(userId).then(() => {
        notify('User ID copied to clipboard!');
      });
    });
    
    document.getElementById('saveTonWallet').addEventListener('click', () => {
      const wallet = document.getElementById('tonWallet').value.trim();
      if (wallet.length < 10) {
        notify('Please enter a valid TON wallet address!');
        return;
      }
      
      updateUserData({ ton: wallet });
      
      db.ref('admin/tonSubmissions').push({
        userId: userId,
        userName: userName,
        walletAddress: wallet,
        timestamp: now(),
        balance: coinsEarned
      });
      
      notify('TON wallet saved successfully!');
    });
    
    document.getElementById('copyReferralLink').addEventListener('click', () => {
      const link = document.getElementById('referralLink').textContent;
      navigator.clipboard.writeText(link).then(() => {
        notify('Referral link copied to clipboard!');
      });
    });
    
    document.getElementById('viewReferralsBtn').addEventListener('click', () => {
      showReferralList();
    });
    
    document.getElementById('redeemBtn').addEventListener('click', () => {
      const code = document.getElementById('redeemCode').value.trim();
      if (code.length !== 4) {
        notify('Please enter a valid 4-digit code!');
        return;
      }
      
      db.ref('redeemCodes/' + code).once('value').then(snap => {
        if (snap.exists()) {
          const amount = Math.floor(Math.random() * (10000 - 500 + 1)) + 500;
          coinsEarned += amount;
          
          updateUserData({ balance: coinsEarned });
          db.ref('redeemCodes/' + code).remove();
          
          notify(`Redeemed ${amount} SHB successfully!`);
          document.getElementById('redeemCode').value = '';
        } else {
          notify('Invalid or already used code!');
        }
      });
    });
  });
}

function loadProfileSections() {
  return db.ref('profileSections').once('value').then(snap => {
    const sections = snap.val() || {};
    profileSections = [];
    
    Object.keys(sections).forEach(sectionId => {
      profileSections.push({
        id: sectionId,
        name: sections[sectionId].name,
        image: sections[sectionId].image,
        link: sections[sectionId].link
      });
    });
  });
}

function renderRanking() {
  const html = `
    <div class="ranking-main">
      <div class="section-header">
        <div class="section-title">Leaderboard</div>
      </div>
      
      <div class="ranking-position">
        <div class="ranking-position-label">Your Position</div>
        <div class="ranking-position-value" id="myPosition">Loading...</div>
      </div>
      
      <div id="rankingList"></div>
    </div>
  `;
  
  document.getElementById('main-content').innerHTML = html;
  
  if (rankingListener) rankingListener.off();
  
  const usersRef = db.ref('users');
  
  function updateRankingList(snap) {
    const users = [];
    
    snap.forEach(child => {
      const userData = child.val();
      users.push({
        id: child.key,
        name: userData.name || 'Unknown',
        avatar: userData.avatar || 'https://github.com/akhterefti-del/Shark/blob/76091d5ce35c6707100f0269223352d0b5c1a163/Gemini_Generated_Image_ad2lr0ad2lr0ad2l.png?raw=true',
        balance: userData.balance || 0
      });
    });
    
    users.sort((a, b) => b.balance - a.balance);
    
    const myPosition = users.findIndex(u => u.id === userId) + 1;
    const top200 = users.slice(0, 200);
    
    let html = '';
    top200.forEach((user, index) => {
      const position = index + 1;
      const isTop3 = position <= 3;
      
      html += `
        <div class="ranking-row">
          <div class="ranking-position-num ${isTop3 ? 'top3' : ''}">${position}</div>
          <img src="${user.avatar}" class="ranking-avatar" alt="${user.name}" />
          <div class="ranking-user-info">
            <div class="ranking-user-name">${user.name}</div>
            <div class="ranking-user-id">ID: ${user.id}</div>
          </div>
          <div class="ranking-balance">${user.balance} SHB</div>
        </div>
      `;
    });
    
    document.getElementById('rankingList').innerHTML = html;
    document.getElementById('myPosition').textContent = myPosition > 0 ? `#${myPosition}` : 'Unranked';
  }
  
  usersRef.on('value', updateRankingList);
  rankingListener = usersRef;
}

// CRYPTO TRADING FUNCTIONS

function initializeCryptoPrices() {
  // Simulate crypto prices (in production, use real API)
  tradingPlans.forEach(plan => {
    const basePrice = plan.price;
    const variation = (Math.random() - 0.5) * basePrice * 0.1;
    cryptoPrices[plan.pair] = basePrice + variation;
  });
  
  // Update prices every 5 seconds
  if (priceUpdateInterval) clearInterval(priceUpdateInterval);
  priceUpdateInterval = setInterval(() => {
    tradingPlans.forEach(plan => {
      const currentPrice = cryptoPrices[plan.pair];
      const change = (Math.random() - 0.5) * currentPrice * 0.02;
      cryptoPrices[plan.pair] = Math.max(currentPrice + change, plan.price * 0.5);
    });
    
    // Update displayed prices if trading screen is open
    const tradingScreen = document.getElementById('crypto-trading-screen');
    if (tradingScreen.style.display !== 'none') {
      updateTradingPlanPrices();
    }
  }, 5000);
}

function setupTradingListeners() {
  // Listen for balance updates
  db.ref(`users/${userId}/trading/usdtBalance`).on('value', snapshot => {
    tradingData.usdtBalance = snapshot.val() || 0;
    updateTradingBalanceDisplay();
  });
  
  db.ref(`users/${userId}/trading/tonBalance`).on('value', snapshot => {
    tradingData.tonBalance = snapshot.val() || 0;
    updateTradingBalanceDisplay();
  });
  
  // Listen for active trades
  db.ref(`users/${userId}/trading/activeTrades`).on('value', snapshot => {
    tradingData.activeTrades = snapshot.val() || {};
    if (document.getElementById('my-trades-content').classList.contains('active')) {
      renderMyTrades();
    }
  });
}

function updateTradingBalanceDisplay() {
  const usdtBalanceEl = document.getElementById('usdtBalance');
  const tonBalanceEl = document.getElementById('tonBalance');
  
  if (usdtBalanceEl) usdtBalanceEl.textContent = tradingData.usdtBalance.toFixed(2);
  if (tonBalanceEl) tonBalanceEl.textContent = tradingData.tonBalance.toFixed(2);
}

function openCryptoTrading() {
  document.getElementById('crypto-trading-screen').style.display = 'block';
  document.getElementById('app').style.display = 'none';
  
  renderTradingPlans();
  updateTradingBalanceDisplay();
}

function closeCryptoTrading() {
  document.getElementById('crypto-trading-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
}

function renderTradingPlans() {
  const grid = document.getElementById('tradingPlansGrid');
  grid.innerHTML = '';
  
  tradingPlans.forEach((plan, index) => {
    const currentPrice = cryptoPrices[plan.pair] || plan.price;
    const priceChange = ((currentPrice - plan.price) / plan.price * 100).toFixed(2);
    const priceColor = priceChange >= 0 ? '#4caf50' : '#f44336';
    
    const card = document.createElement('div');
    card.className = 'trading-plan-card';
    card.innerHTML = `
      <div class="trading-plan-header">
        <div class="trading-plan-pair">${plan.pair}</div>
        <div class="trading-plan-badge">HOT</div>
      </div>
      <div class="trading-plan-chart" id="chart-${index}"></div>
      <div class="trading-plan-price" style="color: ${priceColor}">
        $${currentPrice.toFixed(2)}
        <span style="font-size: 14px; margin-left: 8px;">${priceChange >= 0 ? '+' : ''}${priceChange}%</span>
      </div>
      <div class="trading-plan-details">
        <div class="trading-plan-detail">
          <div class="trading-plan-detail-label">Investment</div>
          <div class="trading-plan-detail-value">$${plan.price}</div>
        </div>
        <div class="trading-plan-detail">
          <div class="trading-plan-detail-label">Daily Earning</div>
          <div class="trading-plan-detail-value">$${plan.dailyEarning}</div>
        </div>
        <div class="trading-plan-detail">
          <div class="trading-plan-detail-label">Duration</div>
          <div class="trading-plan-detail-value">${plan.duration} Days</div>
        </div>
        <div class="trading-plan-detail">
          <div class="trading-plan-detail-label">Min. Invest</div>
          <div class="trading-plan-detail-value">$${plan.minInvest}</div>
        </div>
      </div>
      <button class="trading-plan-buy-btn" onclick="buyTradingPlan(${index})">
        Buy Plan
      </button>
    `;
    grid.appendChild(card);
    
    // Initialize TradingView widget for each plan
    setTimeout(() => {
      const chartContainer = document.getElementById(`chart-${index}`);
      if (chartContainer && typeof TradingView !== 'undefined') {
        new TradingView.widget({
          container_id: `chart-${index}`,
          symbol: plan.pair.replace('/', ''),
          interval: '5',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: 'rgba(0, 0, 0, 0)',
          enable_publishing: false,
          hide_top_toolbar: true,
          hide_legend: true,
          save_image: false,
          height: 150,
          width: '100%'
        });
      }
    }, 100);
  });
}

function updateTradingPlanPrices() {
  tradingPlans.forEach((plan, index) => {
    const currentPrice = cryptoPrices[plan.pair] || plan.price;
    const priceChange = ((currentPrice - plan.price) / plan.price * 100).toFixed(2);
    const priceColor = priceChange >= 0 ? '#4caf50' : '#f44336';
    
    const priceEl = document.querySelectorAll('.trading-plan-price')[index];
    if (priceEl) {
      priceEl.innerHTML = `
        $${currentPrice.toFixed(2)}
        <span style="font-size: 14px; margin-left: 8px;">${priceChange >= 0 ? '+' : ''}${priceChange}%</span>
      `;
      priceEl.style.color = priceColor;
    }
  });
}

function buyTradingPlan(planIndex) {
  const plan = tradingPlans[planIndex];
  
  if (tradingData.usdtBalance < plan.price) {
    notify('Insufficient USDT balance! Please deposit first.');
    return;
  }
  
  if (!confirm(`Buy ${plan.pair} trading plan for $${plan.price}?`)) {
    return;
  }
  
  // Deduct balance
  const newBalance = tradingData.usdtBalance - plan.price;
  db.ref(`users/${userId}/trading/usdtBalance`).set(newBalance);
  
  // Create trade
  const tradeId = 'trade_' + now() + '_' + Math.random().toString(36).substr(2, 9);
  const tradeData = {
    tradeId: tradeId,
    pair: plan.pair,
    investment: plan.price,
    dailyEarning: plan.dailyEarning,
    duration: plan.duration,
    daysCompleted: 0,
    totalEarned: 0,
    lastClaimTime: now(),
    startTime: now(),
    status: 'active'
  };
  
  db.ref(`users/${userId}/trading/activeTrades/${tradeId}`).set(tradeData);
  db.ref(`admin/trading/purchases`).push({
    userId: userId,
    userName: userName,
    ...tradeData,
    timestamp: now()
  });
  
  // Add to trade history
  db.ref(`users/${userId}/trading/tradeHistory`).push({
    type: 'purchase',
    pair: plan.pair,
    amount: plan.price,
    timestamp: now()
  });
  
  notify(`Successfully purchased ${plan.pair} trading plan!`);
  
  // Switch to My Trades tab
  document.querySelectorAll('.trading-nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tradingTab === 'my-trades') {
      btn.classList.add('active');
    }
  });
  
  document.querySelectorAll('.trading-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('my-trades-content').classList.add('active');
  
  renderMyTrades();
}

function renderMyTrades() {
  const container = document.getElementById('myTradesList');
  
  if (Object.keys(tradingData.activeTrades).length === 0) {
    container.innerHTML = `
      <div class="my-trades-empty">
        <div class="my-trades-empty-icon">📊</div>
        <div class="my-trades-empty-text">No active trades yet</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  
  Object.keys(tradingData.activeTrades).forEach(tradeId => {
    const trade = tradingData.activeTrades[tradeId];
    const currentTime = now();
    const timeSinceLastClaim = currentTime - trade.lastClaimTime;
    const canClaim = timeSinceLastClaim >= 86400; // 24 hours
    const progress = (trade.daysCompleted / trade.duration * 100).toFixed(1);
    const timeUntilClaim = canClaim ? 0 : 86400 - timeSinceLastClaim;
    const hoursUntilClaim = Math.floor(timeUntilClaim / 3600);
    const minutesUntilClaim = Math.floor((timeUntilClaim % 3600) / 60);
    
    const card = document.createElement('div');
    card.className = 'my-trade-card';
    card.innerHTML = `
      <div class="my-trade-header">
        <div class="my-trade-pair">${trade.pair}</div>
        <div class="my-trade-status ${trade.status}">${trade.status}</div>
      </div>
      <div class="my-trade-details">
        <div class="my-trade-detail">
          <div class="my-trade-detail-label">Investment</div>
          <div class="my-trade-detail-value">$${trade.investment}</div>
        </div>
        <div class="my-trade-detail">
          <div class="my-trade-detail-label">Daily Earning</div>
          <div class="my-trade-detail-value">$${trade.dailyEarning}</div>
        </div>
        <div class="my-trade-detail">
          <div class="my-trade-detail-label">Days Completed</div>
          <div class="my-trade-detail-value">${trade.daysCompleted}/${trade.duration}</div>
        </div>
        <div class="my-trade-detail">
          <div class="my-trade-detail-label">Total Earned</div>
          <div class="my-trade-detail-value">$${trade.totalEarned.toFixed(2)}</div>
        </div>
      </div>
      <div class="my-trade-progress">
        <div class="my-trade-progress-label">
          <span>Progress</span>
          <span>${progress}%</span>
        </div>
        <div class="my-trade-progress-bar">
          <div class="my-trade-progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
      <button class="my-trade-claim-btn" id="claim-${tradeId}" ${!canClaim || trade.daysCompleted >= trade.duration ? 'disabled' : ''}>
        ${trade.daysCompleted >= trade.duration ? 'Completed' : (canClaim ? 'Claim Daily Earning' : `Next claim in ${hoursUntilClaim}h ${minutesUntilClaim}m`)}
      </button>
    `;
    container.appendChild(card);
    
    if (canClaim && trade.daysCompleted < trade.duration) {
      document.getElementById(`claim-${tradeId}`).addEventListener('click', () => {
        claimDailyEarning(tradeId);
      });
    }
  });
}

function claimDailyEarning(tradeId) {
  const trade = tradingData.activeTrades[tradeId];
  if (!trade) return;
  
  const currentTime = now();
  const timeSinceLastClaim = currentTime - trade.lastClaimTime;
  
  if (timeSinceLastClaim < 86400) {
    notify('You can only claim once every 24 hours!');
    return;
  }
  
  if (trade.daysCompleted >= trade.duration) {
    notify('This trade has been completed!');
    return;
  }
  
  // Update trade data
  const newDaysCompleted = trade.daysCompleted + 1;
  const newTotalEarned = trade.totalEarned + trade.dailyEarning;
  const newStatus = newDaysCompleted >= trade.duration ? 'completed' : 'active';
  
  db.ref(`users/${userId}/trading/activeTrades/${tradeId}`).update({
    daysCompleted: newDaysCompleted,
    totalEarned: newTotalEarned,
    lastClaimTime: currentTime,
    status: newStatus
  });
  
  // Add earning to balance
  db.ref(`users/${userId}/trading/usdtBalance`).transaction(balance => {
    return (balance || 0) + trade.dailyEarning;
  });
  
  // Add to trade history
  db.ref(`users/${userId}/trading/tradeHistory`).push({
    type: 'claim',
    pair: trade.pair,
    amount: trade.dailyEarning,
    day: newDaysCompleted,
    timestamp: currentTime
  });
  
  notify(`Claimed $${trade.dailyEarning} daily earning!`);
  
  if (newStatus === 'completed') {
    notify(`Trade completed! Total earned: $${newTotalEarned.toFixed(2)}`, 3000);
  }
  
  renderMyTrades();
}

// Wallet Functions

function openWalletModal() {
  document.getElementById('walletModal').style.display = 'flex';
  loadDepositHistory();
}

function closeWalletModal() {
  document.getElementById('walletModal').style.display = 'none';
  if (depositTimer) {
    clearInterval(depositTimer);
    depositTimer = null;
  }
}

function switchWalletTab(tabName) {
  document.querySelectorAll('.wallet-tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.walletTab === tabName) {
      btn.classList.add('active');
    }
  });
  
  document.querySelectorAll('.wallet-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  document.getElementById(`wallet-${tabName}-content`).classList.add('active');
  
  if (tabName === 'deposit-history') loadDepositHistory();
  else if (tabName === 'withdraw-history') loadWithdrawHistory();
  else if (tabName === 'trade-history') loadTradeHistory();
}

function confirmDeposit() {
  const amount = parseFloat(document.getElementById('depositAmount').value);
  
  if (!amount || amount < 30) {
    notify('Minimum deposit amount is $30!');
    return;
  }
  
  // Generate unique memo
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const memo = `shark${randomNum}`;
  
  document.getElementById('depositMemo').textContent = `Memo: ${memo}`;
  document.getElementById('depositQRSection').style.display = 'block';
  
  // Start 15-minute timer
  let timeLeft = 900; // 15 minutes in seconds
  
  if (depositTimer) clearInterval(depositTimer);
  
  depositTimer = setInterval(() => {
    timeLeft--;
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    document.getElementById('depositTimer').textContent = 
      `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
      clearInterval(depositTimer);
      notify('Deposit time expired! Please try again.');
      document.getElementById('depositQRSection').style.display = 'none';
    }
  }, 1000);
  
  // Store deposit info temporarily
  window.currentDeposit = {
    amount: amount,
    memo: memo,
    timestamp: now()
  };
}

function submitDeposit() {
  const txHash = document.getElementById('depositTxHash').value.trim();
  
  if (!txHash || txHash.length < 10) {
    notify('Please enter a valid transaction hash!');
    return;
  }
  
  if (!window.currentDeposit) {
    notify('Please start a new deposit!');
    return;
  }
  
  const depositId = 'dep_' + now() + '_' + Math.random().toString(36).substr(2, 9);
  const depositData = {
    depositId: depositId,
    userId: userId,
    userName: userName,
    amount: window.currentDeposit.amount,
    memo: window.currentDeposit.memo,
    txHash: txHash,
    timestamp: now(),
    status: 'pending'
  };
  
  // Save to user's deposit history
  db.ref(`users/${userId}/trading/depositHistory/${depositId}`).set(depositData);
  
  // Save to admin panel
  db.ref('admin/trading/deposits').push(depositData);
  
  notify('Deposit submitted! Waiting for admin approval...');
  
  // Clear form
  document.getElementById('depositAmount').value = '';
  document.getElementById('depositTxHash').value = '';
  document.getElementById('depositQRSection').style.display = 'none';
  
  if (depositTimer) {
    clearInterval(depositTimer);
    depositTimer = null;
  }
  
  window.currentDeposit = null;
  
  // Switch to deposit history
  switchWalletTab('deposit-history');
}

function confirmWithdraw() {
  const address = document.getElementById('withdrawAddress').value.trim();
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const memo = document.getElementById('withdrawMemo').value.trim();
  
  if (!address || address.length < 10) {
    notify('Please enter a valid USDT TON address!');
    return;
  }
  
  if (!amount || amount < 0.10) {
    notify('Minimum withdrawal amount is $0.10!');
    return;
  }
  
  if (amount > tradingData.usdtBalance) {
    notify('Insufficient balance!');
    return;
  }
  
  if (!confirm(`Withdraw $${amount} to ${address.substring(0, 10)}...?`)) {
    return;
  }
  
  // Deduct balance
  const newBalance = tradingData.usdtBalance - amount;
  db.ref(`users/${userId}/trading/usdtBalance`).set(newBalance);
  
  const withdrawId = 'with_' + now() + '_' + Math.random().toString(36).substr(2, 9);
  const withdrawData = {
    withdrawId: withdrawId,
    userId: userId,
    userName: userName,
    amount: amount,
    address: address,
    memo: memo,
    timestamp: now(),
    status: 'pending'
  };
  
  // Save to user's withdraw history
  db.ref(`users/${userId}/trading/withdrawHistory/${withdrawId}`).set(withdrawData);
  
  // Save to admin panel
  db.ref('admin/trading/withdrawals').push(withdrawData);
  
  notify('Withdrawal request submitted! Waiting for admin approval...');
  
  // Clear form
  document.getElementById('withdrawAddress').value = '';
  document.getElementById('withdrawAmount').value = '';
  document.getElementById('withdrawMemo').value = '';
  
  // Switch to withdraw history
  switchWalletTab('withdraw-history');
}

function loadDepositHistory() {
  db.ref(`users/${userId}/trading/depositHistory`).once('value').then(snapshot => {
    const container = document.getElementById('depositHistoryList');
    
    if (!snapshot.exists()) {
      container.innerHTML = '<div class="wallet-history-empty">No deposit history yet</div>';
      return;
    }
    
    let html = '';
    snapshot.forEach(child => {
      const deposit = child.val();
      html += `
        <div class="wallet-history-item">
          <div class="wallet-history-header">
            <div class="wallet-history-type">Deposit</div>
            <div class="wallet-history-status ${deposit.status}">${deposit.status}</div>
          </div>
          <div class="wallet-history-details">
            <div class="wallet-history-amount">$${deposit.amount}</div>
            <div class="wallet-history-detail">Memo: ${deposit.memo}</div>
            <div class="wallet-history-detail">TX: ${deposit.txHash.substring(0, 20)}...</div>
            <div class="wallet-history-detail">${new Date(deposit.timestamp * 1000).toLocaleString()}</div>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  });
}

function loadWithdrawHistory() {
  db.ref(`users/${userId}/trading/withdrawHistory`).once('value').then(snapshot => {
    const container = document.getElementById('withdrawHistoryList');
    
    if (!snapshot.exists()) {
      container.innerHTML = '<div class="wallet-history-empty">No withdrawal history yet</div>';
      return;
    }
    
    let html = '';
    snapshot.forEach(child => {
      const withdraw = child.val();
      html += `
        <div class="wallet-history-item">
          <div class="wallet-history-header">
            <div class="wallet-history-type">Withdrawal</div>
            <div class="wallet-history-status ${withdraw.status}">${withdraw.status}</div>
          </div>
          <div class="wallet-history-details">
            <div class="wallet-history-amount">$${withdraw.amount}</div>
            <div class="wallet-history-detail">To: ${withdraw.address.substring(0, 20)}...</div>
            ${withdraw.memo ? `<div class="wallet-history-detail">Memo: ${withdraw.memo}</div>` : ''}
            <div class="wallet-history-detail">${new Date(withdraw.timestamp * 1000).toLocaleString()}</div>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  });
}

function loadTradeHistory() {
  db.ref(`users/${userId}/trading/tradeHistory`).once('value').then(snapshot => {
    const container = document.getElementById('tradeHistoryList');
    
    if (!snapshot.exists()) {
      container.innerHTML = '<div class="wallet-history-empty">No trade history yet</div>';
      return;
    }
    
    let html = '';
    const history = [];
    snapshot.forEach(child => {
      history.push(child.val());
    });
    
    // Sort by timestamp descending
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    history.forEach(trade => {
      const typeLabel = trade.type === 'purchase' ? 'Purchased Plan' : 'Claimed Earning';
      const typeColor = trade.type === 'purchase' ? '#f5576c' : '#4caf50';
      
      html += `
        <div class="wallet-history-item">
          <div class="wallet-history-header">
            <div class="wallet-history-type" style="color: ${typeColor}">${typeLabel}</div>
          </div>
          <div class="wallet-history-details">
            <div class="wallet-history-amount">$${trade.amount}</div>
            <div class="wallet-history-detail">Pair: ${trade.pair}</div>
            ${trade.day ? `<div class="wallet-history-detail">Day: ${trade.day}</div>` : ''}
            <div class="wallet-history-detail">${new Date(trade.timestamp * 1000).toLocaleString()}</div>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  });
}

// Event Listeners

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    showTab(this.dataset.tab);
  });
});

document.getElementById('closeReferralModal').addEventListener('click', () => {
  document.getElementById('referralModal').style.display = 'none';
});

document.getElementById('referralModal').addEventListener('click', (e) => {
  if (e.target.id === 'referralModal') {
    document.getElementById('referralModal').style.display = 'none';
  }
});

// Trading Event Listeners

document.getElementById('tradingBackBtn').addEventListener('click', closeCryptoTrading);

document.getElementById('tradingWalletBtn').addEventListener('click', () => {
  const balanceDisplay = document.getElementById('tradingBalanceDisplay');
  balanceDisplay.style.display = balanceDisplay.style.display === 'none' ? 'flex' : 'none';
});

document.querySelectorAll('.trading-nav-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.trading-nav-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    document.querySelectorAll('.trading-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const tabName = this.dataset.tradingTab;
    document.getElementById(`${tabName}-content`).classList.add('active');
    
    if (tabName === 'my-trades') {
      renderMyTrades();
    }
  });
});

// Wallet Modal Event Listeners

document.getElementById('walletModalClose').addEventListener('click', closeWalletModal);

document.querySelectorAll('.wallet-tab-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    switchWalletTab(this.dataset.walletTab);
  });
});

document.getElementById('confirmDepositBtn').addEventListener('click', confirmDeposit);
document.getElementById('submitDepositBtn').addEventListener('click', submitDeposit);
document.getElementById('confirmWithdrawBtn').addEventListener('click', confirmWithdraw);

// Click outside wallet modal to close
document.getElementById('walletModal').addEventListener('click', (e) => {
  if (e.target.id === 'walletModal') {
    closeWalletModal();
  }
});

// Initialize profile sections
db.ref('profileSections').once('value').then(snap => {
  if (!snap.exists()) {
    db.ref('profileSections').set({
      roadmap: {
        name: 'Roadmap',
        image: 'https://github.com/akhterefti-del/Shark/blob/7e14b838bb95a2bb6ab2cc81008d2b69cfbe2d0b/readmap.png?raw=true',
        link: 'https://example.com/roadmap'
      },
      presale: {
        name: 'Presale',
        image: 'https://github.com/akhterefti-del/Shark/blob/7e14b838bb95a2bb6ab2cc81008d2b69cfbe2d0b/presale.png?raw=true',
        link: 'https://example.com/presale'
      }
    });
  }
});

// Initialize app
if (getTelegramUserData()) {
  loadUserData();
} else {
  notify('Failed to initialize Telegram user data');
}

// Add wallet button click handler
document.addEventListener('DOMContentLoaded', () => {
  const walletBtn = document.getElementById('tradingWalletBtn');
  if (walletBtn) {
    walletBtn.addEventListener('click', openWalletModal);
  }
});
