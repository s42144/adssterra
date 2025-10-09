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
let tradingPlans = [];
let userTrades = [];
let usdtBalance = 0;
let tonBalance = 0;
let depositTimer = null;
let currentDepositData = null;

// Passive Income Activity Tracking
let lastActivityTime = null;
let incomeActive = true;
let activityCheckTimer = null;
const ACTIVITY_TIMEOUT = 3 * 60 * 60; // 3 hours in seconds

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

// Generate unique memo for deposits
function generateUserMemo() {
  if (!userData.depositMemo) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    userData.depositMemo = `shark${randomNum}`;
    db.ref('users/' + userId).update({ depositMemo: userData.depositMemo });
  }
  return userData.depositMemo;
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

// Initialize Trading Plans
function initializeTradingPlans() {
  const plans = [
    { pair: 'BTC/USDT', price: 3000, dailyEarning: 300, duration: 30, gradient: 'linear-gradient(135deg, #f7931a 0%, #ff9500 100%)' },
    { pair: 'ETH/USDT', price: 2000, dailyEarning: 200, duration: 30, gradient: 'linear-gradient(135deg, #627eea 0%, #8a92b2 100%)' },
    { pair: 'BNB/USDT', price: 1500, dailyEarning: 150, duration: 30, gradient: 'linear-gradient(135deg, #f3ba2f 0%, #fcd535 100%)' },
    { pair: 'SOL/USDT', price: 1200, dailyEarning: 120, duration: 30, gradient: 'linear-gradient(135deg, #00d4aa 0%, #14f195 100%)' },
    { pair: 'XRP/USDT', price: 1000, dailyEarning: 100, duration: 30, gradient: 'linear-gradient(135deg, #23292f 0%, #346aa9 100%)' },
    { pair: 'ADA/USDT', price: 800, dailyEarning: 80, duration: 30, gradient: 'linear-gradient(135deg, #0033ad 0%, #0d47a1 100%)' },
    { pair: 'DOGE/USDT', price: 600, dailyEarning: 60, duration: 30, gradient: 'linear-gradient(135deg, #c2a633 0%, #d5b43f 100%)' },
    { pair: 'DOT/USDT', price: 500, dailyEarning: 50, duration: 30, gradient: 'linear-gradient(135deg, #e6007a 0%, #ff1864 100%)' },
    { pair: 'MATIC/USDT', price: 400, dailyEarning: 40, duration: 30, gradient: 'linear-gradient(135deg, #8247e5 0%, #a855f7 100%)' },
    { pair: 'LINK/USDT', price: 350, dailyEarning: 35, duration: 30, gradient: 'linear-gradient(135deg, #2a5ada 0%, #375bd2 100%)' },
    { pair: 'UNI/USDT', price: 300, dailyEarning: 30, duration: 30, gradient: 'linear-gradient(135deg, #ff007a 0%, #ff4d8d 100%)' },
    { pair: 'AVAX/USDT', price: 250, dailyEarning: 25, duration: 30, gradient: 'linear-gradient(135deg, #e84142 0%, #ff5252 100%)' },
    { pair: 'ATOM/USDT', price: 200, dailyEarning: 20, duration: 30, gradient: 'linear-gradient(135deg, #2e3148 0%, #6f7390 100%)' },
    { pair: 'LTC/USDT', price: 180, dailyEarning: 18, duration: 30, gradient: 'linear-gradient(135deg, #345d9d 0%, #4a90e2 100%)' },
    { pair: 'TRX/USDT', price: 150, dailyEarning: 15, duration: 30, gradient: 'linear-gradient(135deg, #eb0029 0%, #ff1744 100%)' },
    { pair: 'XLM/USDT', price: 120, dailyEarning: 12, duration: 30, gradient: 'linear-gradient(135deg, #000000 0%, #14b6e7 100%)' },
    { pair: 'ALGO/USDT', price: 100, dailyEarning: 10, duration: 30, gradient: 'linear-gradient(135deg, #000000 0%, #ffffff 100%)' },
    { pair: 'VET/USDT', price: 80, dailyEarning: 8, duration: 30, gradient: 'linear-gradient(135deg, #15bdff 0%, #4fc3f7 100%)' },
    { pair: 'FIL/USDT', price: 60, dailyEarning: 6, duration: 30, gradient: 'linear-gradient(135deg, #0090ff 0%, #42a5f5 100%)' },
    { pair: 'SHIB/USDT', price: 40, dailyEarning: 4, duration: 30, gradient: 'linear-gradient(135deg, #ffa409 0%, #ffb74d 100%)' }
  ];
  
  db.ref('tradingPlans').once('value').then(snap => {
    if (!snap.exists()) {
      const plansObj = {};
      plans.forEach((plan, index) => {
        plansObj[`plan${index + 1}`] = plan;
      });
      db.ref('tradingPlans').set(plansObj);
    }
  });
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
        // Trading data
        usdtBalance: 0,
        tonBalance: 0,
        trades: {},
        depositHistory: {},
        withdrawHistory: {},
        tradeHistory: {},
        activities: {}
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
    
    // Load trading data
    usdtBalance = userData.usdtBalance || 0;
    tonBalance = userData.tonBalance || 0;
    
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
    
    // Initialize trading plans
    initializeTradingPlans();
    
    // Load user trades
    loadUserTrades();
    
    processReferral().then(() => {
      updateLoadingProgress('Starting app...');
      
      setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
      }, 1000);
      
      showTab('home');
      setupIncomeBooster();
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
  if (newData.usdtBalance !== undefined) usdtBalance = newData.usdtBalance;
  if (newData.tonBalance !== undefined) tonBalance = newData.tonBalance;
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
      
      <div class="crypto-trading-card" id="openTradingBtn">
        <div class="crypto-icon">📈</div>
        <div class="crypto-title">Crypto Trading</div>
        <div class="crypto-subtitle">Invest in crypto plans and earn daily profits</div>
        <button class="btn-primary">Open Trading</button>
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
  
  // Open Trading Screen
  document.getElementById('openTradingBtn').addEventListener('click', openTradingScreen);
  
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

// TRADING FUNCTIONS
function openTradingScreen() {
  document.getElementById('trading-screen').style.display = 'flex';
  updateTradingBalances();
  showTradingTab('plans');
}

function closeTradingScreen() {
  document.getElementById('trading-screen').style.display = 'none';
}

function updateTradingBalances() {
  document.getElementById('usdtBalance').textContent = usdtBalance.toFixed(2);
  document.getElementById('tonBalance').textContent = tonBalance.toFixed(2);
}

function showTradingTab(tab) {
  document.querySelectorAll('.trading-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tradingTab === tab);
  });
  
  if (tab === 'plans') renderTradingPlans();
  if (tab === 'mytrades') renderMyTrades();
}

function renderTradingPlans() {
  db.ref('tradingPlans').once('value').then(snap => {
    const plans = snap.val() || {};
    let html = '<div class="trading-plans-grid">';
    
    Object.keys(plans).forEach(planId => {
      const plan = plans[planId];
      html += `
        <div class="trading-plan-card" style="background: ${plan.gradient}">
          <div class="plan-header">
            <div class="plan-pair">${plan.pair}</div>
            <div class="plan-badge">Hot</div>
          </div>
          <div class="plan-chart-container" id="chart-${planId}"></div>
          <div class="plan-details">
            <div class="plan-detail-item">
              <div class="plan-detail-label">Daily Earning</div>
              <div class="plan-detail-value">$${plan.dailyEarning}</div>
            </div>
            <div class="plan-detail-item">
              <div class="plan-detail-label">Duration</div>
              <div class="plan-detail-value">${plan.duration} Days</div>
            </div>
          </div>
          <div class="plan-price">$${plan.price}</div>
          <button class="plan-buy-btn" data-plan-id="${planId}" ${usdtBalance < plan.price ? 'disabled' : ''}>
            ${usdtBalance < plan.price ? 'Insufficient Balance' : 'Buy Plan'}
          </button>
        </div>
      `;
    });
    
    html += '</div>';
    document.getElementById('tradingContent').innerHTML = html;
    
    // Add buy button listeners
    document.querySelectorAll('.plan-buy-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const planId = this.dataset.planId;
        buyTradingPlan(planId, plans[planId]);
      });
    });
    
    // Initialize mini charts
    Object.keys(plans).forEach(planId => {
      initMiniChart(planId, plans[planId].pair);
    });
  });
}

function initMiniChart(planId, pair) {
  const container = document.getElementById(`chart-${planId}`);
  if (!container) return;
  
  // Simple canvas chart simulation
  const canvas = document.createElement('canvas');
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  
  // Generate random chart data
  const points = 20;
  const data = [];
  for (let i = 0; i < points; i++) {
    data.push(Math.random() * 80 + 20);
  }
  
  ctx.beginPath();
  data.forEach((value, index) => {
    const x = (canvas.width / (points - 1)) * index;
    const y = canvas.height - (value / 100) * canvas.height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function buyTradingPlan(planId, plan) {
  if (usdtBalance < plan.price) {
    notify('Insufficient USDT balance!');
    return;
  }
  
  // Deduct balance
  usdtBalance -= plan.price;
  
  // Create trade
  const tradeId = db.ref('users/' + userId + '/trades').push().key;
  const tradeData = {
    planId: planId,
    pair: plan.pair,
    price: plan.price,
    dailyEarning: plan.dailyEarning,
    duration: plan.duration,
    startDate: now(),
    endDate: now() + (plan.duration * 24 * 60 * 60),
    totalEarned: 0,
    lastClaim: now(),
    status: 'active'
  };
  
  db.ref('users/' + userId + '/trades/' + tradeId).set(tradeData);
  
  // Update balance
  updateUserData({ usdtBalance: usdtBalance });
  
  // Log activity
  logActivity('trade_purchase', `Purchased ${plan.pair} plan for $${plan.price}`);
  
  // Log trade history
  logTradeHistory('purchase', plan.pair, plan.price);
  
  notify(`Successfully purchased ${plan.pair} plan!`);
  updateTradingBalances();
  showTradingTab('mytrades');
}

function loadUserTrades() {
  db.ref('users/' + userId + '/trades').on('value', (snapshot) => {
    userTrades = [];
    snapshot.forEach(child => {
      userTrades.push({
        id: child.key,
        ...child.val()
      });
    });
  });
}

function renderMyTrades() {
  if (userTrades.length === 0) {
    document.getElementById('tradingContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-text">No active trades yet. Start investing in crypto plans!</div>
      </div>
    `;
    return;
  }
  
  let html = '<div class="my-trades-list">';
  
  userTrades.forEach(trade => {
    const currentTime = now();
    const elapsed = currentTime - trade.startDate;
    const totalDuration = trade.endDate - trade.startDate;
    const progress = Math.min((elapsed / totalDuration) * 100, 100);
    
    const daysElapsed = Math.floor(elapsed / (24 * 60 * 60));
    const daysRemaining = Math.max(0, trade.duration - daysElapsed);
    
    const canClaim = (currentTime - trade.lastClaim) >= (24 * 60 * 60);
    const isCompleted = currentTime >= trade.endDate;
    
    html += `
      <div class="trade-item">
        <div class="trade-item-header">
          <div class="trade-pair">${trade.pair}</div>
          <div class="trade-status ${isCompleted ? 'completed' : 'active'}">
            ${isCompleted ? 'Completed' : 'Active'}
          </div>
        </div>
        <div class="trade-info-grid">
          <div class="trade-info-item">
            <div class="trade-info-label">Investment</div>
            <div class="trade-info-value">$${trade.price}</div>
          </div>
          <div class="trade-info-item">
            <div class="trade-info-label">Daily Earning</div>
            <div class="trade-info-value">$${trade.dailyEarning}</div>
          </div>
          <div class="trade-info-item">
            <div class="trade-info-label">Total Earned</div>
            <div class="trade-info-value">$${trade.totalEarned}</div>
          </div>
          <div class="trade-info-item">
            <div class="trade-info-label">Days Left</div>
            <div class="trade-info-value">${daysRemaining}</div>
          </div>
        </div>
        <div class="trade-progress-bar">
          <div class="trade-progress-fill" style="width: ${progress}%"></div>
        </div>
        <button class="trade-claim-btn" data-trade-id="${trade.id}" ${!canClaim || isCompleted ? 'disabled' : ''}>
          ${isCompleted ? 'Completed' : (canClaim ? 'Claim Daily Earning' : 'Claimed Today')}
        </button>
      </div>
    `;
  });
  
  html += '</div>';
  document.getElementById('tradingContent').innerHTML = html;
  
  // Add claim button listeners
  document.querySelectorAll('.trade-claim-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tradeId = this.dataset.tradeId;
      claimDailyEarning(tradeId);
    });
  });
}

function claimDailyEarning(tradeId) {
  const trade = userTrades.find(t => t.id === tradeId);
  if (!trade) return;
  
  const currentTime = now();
  const canClaim = (currentTime - trade.lastClaim) >= (24 * 60 * 60);
  
  if (!canClaim) {
    notify('You can only claim once every 24 hours!');
    return;
  }
  
  // Add earning to USDT balance
  usdtBalance += trade.dailyEarning;
  
  // Update trade
  const newTotalEarned = trade.totalEarned + trade.dailyEarning;
  db.ref('users/' + userId + '/trades/' + tradeId).update({
    totalEarned: newTotalEarned,
    lastClaim: currentTime
  });
  
  // Update balance
  updateUserData({ usdtBalance: usdtBalance });
  
  // Log activity
  logActivity('daily_claim', `Claimed $${trade.dailyEarning} from ${trade.pair}`);
  
  // Log trade history
  logTradeHistory('claim', trade.pair, trade.dailyEarning);
  
  notify(`Claimed $${trade.dailyEarning} successfully!`);
  updateTradingBalances();
  renderMyTrades();
}

// WALLET FUNCTIONS
function openWalletModal() {
  document.getElementById('wallet-modal').style.display = 'flex';
  showWalletSection('deposit');
}

function closeWalletModal() {
  document.getElementById('wallet-modal').style.display = 'none';
  if (depositTimer) {
    clearInterval(depositTimer);
    depositTimer = null;
  }
}

function showWalletSection(section) {
  document.querySelectorAll('.wallet-section-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.walletSection === section);
  });
  
  if (section === 'deposit') renderDepositSection();
  if (section === 'withdraw') renderWithdrawSection();
  if (section === 'deposit-history') renderDepositHistory();
  if (section === 'withdraw-history') renderWithdrawHistory();
  if (section === 'trade-history') renderTradeHistory();
  if (section === 'activities') renderActivities();
}

function renderDepositSection() {
  const html = `
    <div class="deposit-form" id="depositForm">
      <div class="form-group">
        <label class="form-label">Deposit Amount (USDT)</label>
        <input type="number" class="form-input" id="depositAmount" placeholder="Enter amount" min="30" step="0.01" />
        <div class="form-note">Minimum deposit: $30</div>
      </div>
      <button class="btn-confirm" id="confirmDepositBtn">Confirm Deposit</button>
    </div>
    
    <div class="deposit-payment-screen" id="depositPaymentScreen">
      <div class="payment-timer">
        <div class="timer-label">Time Remaining</div>
        <div class="timer-value" id="paymentTimer">15:00</div>
      </div>
      
      <div class="payment-qr-container">
        <div class="qr-code" id="qrCode"></div>
        <div class="payment-address">UQBWOgFgB4B8qBCo8CNjDUNAtvUSosw4v7v9gkt0GVOaNLSz</div>
      </div>
      
      <div class="payment-info-grid">
        <div class="payment-info-item">
          <div class="payment-info-label">Network</div>
          <div class="payment-info-value">TON</div>
        </div>
        <div class="payment-info-item">
          <div class="payment-info-label">Amount</div>
          <div class="payment-info-value" id="paymentAmount">$0.00</div>
        </div>
      </div>
      
      <div class="payment-memo">
        <div class="payment-memo-label">⚠️ Important: Include this memo</div>
        <div class="payment-memo-value" id="paymentMemo"></div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Transaction Hash</label>
        <input type="text" class="form-input" id="txHash" placeholder="Enter transaction hash" />
      </div>
      
      <button class="btn-confirm" id="submitDepositBtn">Submit Deposit</button>
      <button class="btn-back" id="backToDepositForm">Back</button>
    </div>
  `;
  
  document.getElementById('walletModalBody').innerHTML = html;
  
  document.getElementById('confirmDepositBtn').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    
    if (!amount || amount < 30) {
      notify('Minimum deposit amount is $30!');
      return;
    }
    
    showDepositPayment(amount);
  });
  
  document.getElementById('backToDepositForm').addEventListener('click', () => {
    document.getElementById('depositForm').style.display = 'flex';
    document.getElementById('depositPaymentScreen').style.display = 'none';
    if (depositTimer) {
      clearInterval(depositTimer);
      depositTimer = null;
    }
  });
}

function showDepositPayment(amount) {
  document.getElementById('depositForm').style.display = 'none';
  document.getElementById('depositPaymentScreen').style.display = 'flex';
  
  const memo = generateUserMemo();
  document.getElementById('paymentAmount').textContent = `$${amount.toFixed(2)}`;
  document.getElementById('paymentMemo').textContent = memo;
  
  // Generate QR Code
  const qrContainer = document.getElementById('qrCode');
  qrContainer.innerHTML = '';
  QRCode.toCanvas(qrContainer, 'UQBWOgFgB4B8qBCo8CNjDUNAtvUSosw4v7v9gkt0GVOaNLSz', {
    width: 200,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
  
  // Start 15 minute timer
  let timeLeft = 15 * 60;
  const timerEl = document.getElementById('paymentTimer');
  
  if (depositTimer) clearInterval(depositTimer);
  depositTimer = setInterval(() => {
    timeLeft--;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
      clearInterval(depositTimer);
      notify('Payment time expired. Please try again.');
      renderDepositSection();
    }
  }, 1000);
  
  currentDepositData = { amount, memo };
  
  document.getElementById('submitDepositBtn').addEventListener('click', () => {
    const txHash = document.getElementById('txHash').value.trim();
    
    if (!txHash) {
      notify('Please enter transaction hash!');
      return;
    }
    
    submitDeposit(amount, memo, txHash);
  });
}

function submitDeposit(amount, memo, txHash) {
  const depositId = db.ref('users/' + userId + '/depositHistory').push().key;
  const depositData = {
    amount: amount,
    memo: memo,
    txHash: txHash,
    timestamp: now(),
    status: 'pending',
    network: 'TON'
  };
  
  db.ref('users/' + userId + '/depositHistory/' + depositId).set(depositData);
  
  // Send to admin for approval
  db.ref('admin/deposits/' + depositId).set({
    userId: userId,
    userName: userName,
    ...depositData
  });
  
  // Log activity
  logActivity('deposit_request', `Deposit request for $${amount}`);
  
  if (depositTimer) {
    clearInterval(depositTimer);
    depositTimer = null;
  }
  
  notify('Deposit submitted! Waiting for admin approval.');
  closeWalletModal();
}

function renderWithdrawSection() {
  const html = `
    <div class="deposit-form">
      <div class="form-group">
        <label class="form-label">USDT TON Address</label>
        <input type="text" class="form-input" id="withdrawAddress" placeholder="Enter your USDT TON address" />
      </div>
      <div class="form-group">
        <label class="form-label">Amount (USDT)</label>
        <input type="number" class="form-input" id="withdrawAmount" placeholder="Enter amount" min="0.10" step="0.01" />
        <div class="form-note">Minimum withdrawal: $0.10 | Available: $${usdtBalance.toFixed(2)}</div>
      </div>
      <div class="form-group">
        <label class="form-label">Memo/Comment (Optional)</label>
        <input type="text" class="form-input" id="withdrawMemo" placeholder="Enter memo" />
      </div>
      <button class="btn-confirm" id="confirmWithdrawBtn">Confirm Withdrawal</button>
    </div>
  `;
  
  document.getElementById('walletModalBody').innerHTML = html;
  
  document.getElementById('confirmWithdrawBtn').addEventListener('click', () => {
    const address = document.getElementById('withdrawAddress').value.trim();
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const memo = document.getElementById('withdrawMemo').value.trim();
    
    if (!address) {
      notify('Please enter withdrawal address!');
      return;
    }
    
    if (!amount || amount < 0.10) {
      notify('Minimum withdrawal amount is $0.10!');
      return;
    }
    
    if (amount > usdtBalance) {
      notify('Insufficient balance!');
      return;
    }
    
    submitWithdrawal(address, amount, memo);
  });
}

function submitWithdrawal(address, amount, memo) {
  const withdrawId = db.ref('users/' + userId + '/withdrawHistory').push().key;
  const withdrawData = {
    address: address,
    amount: amount,
    memo: memo,
    timestamp: now(),
    status: 'pending',
    network: 'TON'
  };
  
  db.ref('users/' + userId + '/withdrawHistory/' + withdrawId).set(withdrawData);
  
  // Send to admin for approval
  db.ref('admin/withdrawals/' + withdrawId).set({
    userId: userId,
    userName: userName,
    ...withdrawData
  });
  
  // Log activity
  logActivity('withdrawal_request', `Withdrawal request for $${amount}`);
  
  notify('Withdrawal submitted! Waiting for admin approval.');
  closeWalletModal();
}

function renderDepositHistory() {
  db.ref('users/' + userId + '/depositHistory').once('value').then(snap => {
    const deposits = [];
    snap.forEach(child => {
      deposits.push({ id: child.key, ...child.val() });
    });
    
    if (deposits.length === 0) {
      document.getElementById('walletModalBody').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💰</div>
          <div class="empty-text">No deposit history yet</div>
        </div>
      `;
      return;
    }
    
    deposits.sort((a, b) => b.timestamp - a.timestamp);
    
    let html = '<div class="history-list">';
    deposits.forEach(deposit => {
      const date = new Date(deposit.timestamp * 1000).toLocaleString();
      html += `
        <div class="history-item">
          <div class="history-item-header">
            <div class="history-type">Deposit</div>
            <div class="history-status ${deposit.status}">${deposit.status.toUpperCase()}</div>
          </div>
          <div class="history-details">
            <div class="history-detail-row">
              <span class="history-detail-label">Amount:</span>
              <span class="history-detail-value">$${deposit.amount.toFixed(2)}</span>
            </div>
            <div class="history-detail-row">
              <span class="history-detail-label">Network:</span>
              <span class="history-detail-value">${deposit.network}</span>
            </div>
            <div class="history-detail-row">
              <span class="history-detail-label">Memo:</span>
              <span class="history-detail-value">${deposit.memo}</span>
            </div>
            <div class="history-detail-row">
              <span class="history-detail-label">Date:</span>
              <span class="history-detail-value">${date}</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    document.getElementById('walletModalBody').innerHTML = html;
  });
}

function renderWithdrawHistory() {
  db.ref('users/' + userId + '/withdrawHistory').once('value').then(snap => {
    const withdrawals = [];
    snap.forEach(child => {
      withdrawals.push({ id: child.key, ...child.val() });
    });
    
    if (withdrawals.length === 0) {
      document.getElementById('walletModalBody').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💸</div>
          <div class="empty-text">No withdrawal history yet</div>
        </div>
      `;
      return;
    }
    
    withdrawals.sort((a, b) => b.timestamp - a.timestamp);
    
    let html = '<div class="history-list">';
    withdrawals.forEach(withdrawal => {
      const date = new Date(withdrawal.timestamp * 1000).toLocaleString();
      html += `
        <div class="history-item">
          <div class="history-item-header">
            <div class="history-type">Withdrawal</div>
            <div class="history-status ${withdrawal.status}">${withdrawal.status.toUpperCase()}</div>
          </div>
          <div class="history-details">
            <div class="history-detail-row">
              <span class="history-detail-label">Amount:</span>
              <span class="history-detail-value">$${withdrawal.amount.toFixed(2)}</span>
            </div>
            <div class="history-detail-row">
              <span class="history-detail-label">Address:</span>
              <span class="history-detail-value">${withdrawal.address.substring(0, 20)}...</span>
            </div>
            <div class="history-detail-row">
              <span class="history-detail-label">Network:</span>
              <span class="history-detail-value">${withdrawal.network}</span>
            </div>
            <div class="history-detail-row">
              <span class="history-detail-label">Date:</span>
              <span class="history-detail-value">${date}</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    document.getElementById('walletModalBody').innerHTML = html;
  });
}

function renderTradeHistory() {
  db.ref('users/' + userId + '/tradeHistory').once('value').then(snap => {
    const trades = [];
    snap.forEach(child => {
      trades.push({ id: child.key, ...child.val() });
    });
    
    if (trades.length === 0) {
      document.getElementById('walletModalBody').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-text">No trade history yet</div>
        </div>
      `;
      return;
    }
    
    trades.sort((a, b) => b.timestamp - a.timestamp);
    
    let html = '<div class="history-list">';
    trades.forEach(trade => {
      const date = new Date(trade.timestamp * 1000).toLocaleString();
      html += `
        <div class="history-item">
          <div class="history-item-header">
            <div class="history-type">${trade.type === 'purchase' ? 'Purchase' : 'Claim'}</div>
          </div>
          <div class="history-details">
            <div class="history-detail-row">
              <span class="history-detail-label">Pair:</span>
              <span class="history-detail-value">${trade.pair}</span>
            </div>
            <div class="history-detail-row">
              <span class="history-detail-label">Amount:</span>
              <span class="history-detail-value">$${trade.amount.toFixed(2)}</span>
            </div>
            <div class="history-detail-row">
              <span class="history-detail-label">Date:</span>
              <span class="history-detail-value">${date}</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    document.getElementById('walletModalBody').innerHTML = html;
  });
}

function renderActivities() {
  db.ref('users/' + userId + '/activities').once('value').then(snap => {
    const activities = [];
    snap.forEach(child => {
      activities.push({ id: child.key, ...child.val() });
    });
    
    if (activities.length === 0) {
      document.getElementById('walletModalBody').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">No activities yet</div>
        </div>
      `;
      return;
    }
    
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    let html = '<div class="history-list">';
    activities.forEach(activity => {
      const date = new Date(activity.timestamp * 1000).toLocaleString();
      html += `
        <div class="history-item">
          <div class="history-item-header">
            <div class="history-type">${activity.type.replace('_', ' ').toUpperCase()}</div>
          </div>
          <div class="history-details">
            <div class="history-detail-row">
              <span class="history-detail-label">Description:</span>
              <span class="history-detail-value">${activity.description}</span>
            </div>
            <div class="history-detail-row">
              <span class="history-detail-label">Date:</span>
              <span class="history-detail-value">${date}</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    document.getElementById('walletModalBody').innerHTML = html;
  });
}

function logActivity(type, description) {
  db.ref('users/' + userId + '/activities').push({
    type: type,
    description: description,
    timestamp: now()
  });
}

function logTradeHistory(type, pair, amount) {
  db.ref('users/' + userId + '/tradeHistory').push({
    type: type,
    pair: pair,
    amount: amount,
    timestamp: now()
  });
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
document.getElementById('tradingBackBtn').addEventListener('click', closeTradingScreen);
document.getElementById('tradingWalletBtn').addEventListener('click', openWalletModal);

document.querySelectorAll('.trading-tab').forEach(btn => {
  btn.addEventListener('click', function() {
    showTradingTab(this.dataset.tradingTab);
  });
});

// Wallet Event Listeners
document.getElementById('closeWalletModal').addEventListener('click', closeWalletModal);

document.getElementById('wallet-modal').addEventListener('click', (e) => {
  if (e.target.id === 'wallet-modal') {
    closeWalletModal();
  }
});

document.querySelectorAll('.wallet-section-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    showWalletSection(this.dataset.walletSection);
  });
});

// Initialize Profile Sections
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

// Initialize App
if (getTelegramUserData()) {
  loadUserData();
} else {
  notify('Failed to initialize Telegram user data');
}
