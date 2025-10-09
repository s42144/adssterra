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
  activeTrades: {},
  depositHistory: {},
  withdrawHistory: {},
  tradeHistory: {},
  purchasedPlans: {},
  totalDeposited: 0
};

let cryptoPrices = {};
let priceUpdateInterval = null;
let depositTimer = null;
let depositTimerInterval = null;
let countdownTimers = {};

// Passive Income Activity Tracking
let lastActivityTime = null;
let incomeActive = true;
let activityCheckTimer = null;
const ACTIVITY_TIMEOUT = 3 * 60 * 60; // 3 hours in seconds

// Trading Plans Configuration - ONLY USDT
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

// Update Top Balance Display
function updateTopBalanceDisplay() {
  const topUsdtEl = document.getElementById('topUsdtBalance');
  const topTonEl = document.getElementById('topTonBalance');
  
  if (topUsdtEl) topUsdtEl.textContent = tradingData.usdtBalance.toFixed(2);
  if (topTonEl) topTonEl.textContent = tradingData.tonBalance.toFixed(2);
}

// Hamburger Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburgerMenu');
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      sideMenu.classList.toggle('active');
      menuOverlay.classList.toggle('active');
    });
  }
  
  if (menuOverlay) {
    menuOverlay.addEventListener('click', () => {
      hamburger.classList.remove('active');
      sideMenu.classList.remove('active');
      menuOverlay.classList.remove('active');
    });
  }
  
  // Menu Items
  document.getElementById('menuDeposit')?.addEventListener('click', () => {
    openWalletModal();
    switchWalletTab('deposit');
    closeMenu();
  });
  
  document.getElementById('menuWithdraw')?.addEventListener('click', () => {
    openWalletModal();
    switchWalletTab('withdraw');
    closeMenu();
  });
  
  document.getElementById('menuTradeHistory')?.addEventListener('click', () => {
    openWalletModal();
    switchWalletTab('trade-history');
    closeMenu();
  });
  
  document.getElementById('menuRedeem')?.addEventListener('click', () => {
    showRedeemSection();
    closeMenu();
  });
  
  document.getElementById('menuSettings')?.addEventListener('click', () => {
    showTab('profile');
    closeMenu();
  });
});

function closeMenu() {
  document.getElementById('hamburgerMenu').classList.remove('active');
  document.getElementById('sideMenu').classList.remove('active');
  document.getElementById('menuOverlay').classList.remove('active');
}

// Show Redeem Section
function showRedeemSection() {
  const html = `
    <div class="redeem-section">
      <div class="redeem-title">
        <span class="redeem-icon">🎁</span>
        Redeem Code
      </div>
      <div class="redeem-form">
        <input type="text" 
               class="redeem-input" 
               id="redeemCodeInput" 
               placeholder="XXXXX" 
               maxlength="5" 
               pattern="[A-Z0-9]{5}" />
        <button class="redeem-btn" id="redeemCodeBtn">Redeem Now</button>
        <div class="redeem-info">
          Enter your 5-digit redemption code to claim USDT rewards!<br>
          Rewards range from $0.10 to $3.00 USDT
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('main-content').innerHTML = html;
  
  // Auto-uppercase input
  const input = document.getElementById('redeemCodeInput');
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });
  
  document.getElementById('redeemCodeBtn').addEventListener('click', redeemCode);
}

// Redeem Code Function
function redeemCode() {
  const code = document.getElementById('redeemCodeInput').value.trim();
  
  if (code.length !== 5) {
    notify('Please enter a valid 5-digit code!');
    return;
  }
  
  db.ref('redeemCodes/' + code).once('value').then(snap => {
    if (snap.exists()) {
      const codeData = snap.val();
      
      // Check if code is still valid
      if (codeData.usedCount >= codeData.maxUses) {
        notify('This code has reached its usage limit!');
        return;
      }
      
      // Check if user already used this code
      if (codeData.usedBy && codeData.usedBy[userId]) {
        notify('You have already used this code!');
        return;
      }
      
      // Generate random reward (80% chance for 0.10-0.50, 20% for 0.51-3.00)
      let reward;
      const random = Math.random();
      if (random < 0.8) {
        // 80% chance: 0.10 to 0.50
        reward = (Math.random() * 0.40 + 0.10).toFixed(2);
      } else {
        // 20% chance: 0.51 to 3.00
        reward = (Math.random() * 2.49 + 0.51).toFixed(2);
      }
      
      reward = parseFloat(reward);
      
      // Update user balance
      const newBalance = tradingData.usdtBalance + reward;
      db.ref(`users/${userId}/trading/usdtBalance`).set(newBalance);
      
      // Update code usage
      const updates = {};
      updates[`redeemCodes/${code}/usedCount`] = (codeData.usedCount || 0) + 1;
      updates[`redeemCodes/${code}/usedBy/${userId}`] = {
        timestamp: now(),
        reward: reward,
        userName: userName
      };
      
      db.ref().update(updates);
      
      // Log redemption
      db.ref('admin/redemptions').push({
        userId: userId,
        userName: userName,
        code: code,
        reward: reward,
        timestamp: now()
      });
      
      notify(`🎉 Congratulations! You received $${reward} USDT!`, 3000);
      document.getElementById('redeemCodeInput').value = '';
      
      // Update top balance
      updateTopBalanceDisplay();
      
    } else {
      notify('Invalid redemption code!');
    }
  }).catch(error => {
    console.error('Error redeeming code:', error);
    notify('Error redeeming code. Please try again.');
  });
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
          tradeHistory: {},
          purchasedPlans: {},
          totalDeposited: 0
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
        tradeHistory: {},
        purchasedPlans: {},
        totalDeposited: 0
      };
    }
    
    tradingData = {
      usdtBalance: userData.trading.usdtBalance || 0,
      tonBalance: userData.trading.tonBalance || 0,
      activeTrades: userData.trading.activeTrades || {},
      depositHistory: userData.trading.depositHistory || {},
      withdrawHistory: userData.trading.withdrawHistory || {},
      tradeHistory: userData.trading.tradeHistory || {},
      purchasedPlans: userData.trading.purchasedPlans || {},
      totalDeposited: userData.trading.totalDeposited || 0
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
        updateTopBalanceDisplay();
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

// Continue in next part due to character limit...
