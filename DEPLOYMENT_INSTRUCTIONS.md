Shark Bounty - Complete Deployment & Setup Instructions

🎯 Overview

This guide provides step-by-step instructions to deploy and configure your Shark Bounty Telegram Mini App with all features working correctly.


⸻


📋 What's Been Fixed

✅ Issues Resolved:
1. **Referral System** - Now properly tracks and rewards referrals
2. **Referral Count Display** - Shows accurate referral numbers in profile
3. **Referral Rewards** - Automatically credits 5000 SHB to referrer
4. **Loading Video Removed** - No more GitHub video animation
5. **TON Wallet Integration** - Full TON Keeper wallet connection support
6. **Firebase Push Notifications** - Wallet submissions sent to admin panel


⸻


🚀 Deployment Steps

Step 1: Upload Files to Vercel
1. **Go to your Vercel project**: https://vercel.com/dashboard
2. **Navigate to your project**: `shark-silk-two`
3. **Upload these files**:
- `index.html` (main application file)
- `tonconnect-manifest.json` (TON Connect configuration)


Step 2: Verify Deployment
1. Visit: https://shark-silk-two.vercel.app
2. Check that the app loads without the video animation
3. Verify all sections are accessible (Home, Booster, Earn, Profile, Ranking)


⸻


🔧 Firebase Configuration

Current Firebase Setup:

apiKey: "AIzaSyAHofuS76xf2oGPaJqEtopmcxdoJzjkDL4"
authDomain: "zmex-investments.firebaseapp.com"
databaseURL: "https://zmex-investments-default-rtdb.asia-southeast1.firebasedatabase.app"
projectId: "zmex-investments"


Database Structure:

firebase-root/
├── users/
│   └── {userId}/
│       ├── balance: number
│       ├── energy: number
│       ├── maxEnergy: number
│       ├── multiTap: number
│       ├── incomeBooster: boolean
│       ├── ton: string (wallet address)
│       ├── name: string
│       ├── avatar: string
│       ├── referralCount: number ⭐ NEW
│       ├── referredBy: string (referrer's userId)
│       ├── referredAt: timestamp
│       └── completedTasks: object
│
├── tasks/
│   └── {taskId}/
│       ├── name: string
│       ├── amount: number
│       ├── photo: string (URL)
│       └── link: string (URL)
│
├── profileSections/
│   └── {sectionId}/
│       ├── name: string
│       ├── image: string (URL)
│       └── link: string (URL)
│
├── redeemCodes/
│   └── {code}: boolean
│
├── notifications/
│   └── referrals/
│       └── {notificationId}/
│           ├── referrerId: string
│           ├── newUserId: string
│           ├── newUserName: string
│           ├── timestamp: number
│           └── processed: boolean
│
└── admin/
    └── tonSubmissions/
        └── {submissionId}/
            ├── userId: string
            ├── userName: string
            ├── walletAddress: string
            ├── pushToken: string ⭐ NEW
            ├── timestamp: number
            └── balance: number


⸻


🤖 Telegram Bot Configuration

Bot Setup:
1. **Bot Username**: @SharkBountybot
2. **Mini App URL**: https://shark-silk-two.vercel.app


Referral Link Format:

https://t.me/SharkBountybot?start=r{userId}


Example: `https://t.me/SharkBountybot?start=r123456789`


How Referrals Work:
1. **User A** shares their referral link: `https://t.me/SharkBountybot?start=r{UserA_ID}`
2. **User B** clicks the link and starts the bot
3. **System automatically**:
- Detects User A as the referrer
- Credits User A with 5000 SHB
- Increments User A's `referralCount` by 1
- Stores User A's ID in User B's `referredBy` field
- Creates a notification in `notifications/referrals/`
4. **User A** sees updated referral count in Profile section


⸻


💰 TON Wallet Integration

Features:
1. **Connect Wallet Button** - Appears when no wallet is connected
2. **TON Keeper Support** - Full integration with TON Keeper wallet
3. **Wallet Display** - Shows connected wallet address
4. **Disconnect Option** - Users can disconnect their wallet
5. **Admin Notifications** - Wallet submissions sent to Firebase with push token


Push Token Configuration:

pushToken: 'ftt5nfzlQG24v6LPVLm_oI:APA91bH6IgQli0wfh71lj1CM2j8idCB6KMj9tPg4Lo1qaIFUane5r68S-pLN9JnoATjhdxL_pT5XWdSuQyyTmBc6dCYamvSTjxVme6DooclgH7pmhKdA5-0'


Wallet Address:

UQCOL7arveEVrKfKa9v3SbZnKjIBnOavmX3aXdDV-XD1cQ09


How It Works:
1. User clicks "Connect TON Wallet" button
2. TON Connect UI opens wallet selection
3. User selects TON Keeper and approves connection
4. Wallet address is saved to Firebase
5. Submission sent to `admin/tonSubmissions/` with:
- User ID
- User Name
- Wallet Address
- Push Token (for notifications)
- Timestamp
- Current Balance


⸻


🎮 Features Overview

Home Section:
• ✅ Coin tapping with multi-finger support
• ✅ Real-time balance display
• ✅ Energy system with auto-recovery
• ✅ Multi-tap indicator
• ✅ Profit per hour display


Booster Section:
• ✅ Max Energy upgrade (10 levels)
• ✅ Multi-Tap upgrade (3 levels, up to 4 fingers)
• ✅ Passive Income booster (1 SHB per 10 seconds)


Earn Section:
• ✅ Ad watching (500 SHB per ad)
• ✅ Ad statistics chart
• ✅ Task completion system
• ✅ Dynamic task loading from Firebase


Profile Section:
• ✅ User avatar and name display
• ✅ User ID with copy function
• ✅ TON Wallet connection ⭐ NEW
• ✅ Referral link with copy function
• ✅ Real-time referral count ⭐ FIXED
• ✅ Referral earnings display ⭐ FIXED
• ✅ Redeem code system
• ✅ Dynamic profile sections


Ranking Section:
• ✅ Live leaderboard (top 200)
• ✅ User position display
• ✅ Real-time updates


⸻


🔍 Testing Checklist

Referral System Testing:
1. **Create Test User A**:
- Open bot in one browser/device
- Note the User ID

2. **Get Referral Link**:
- Go to Profile section
- Copy referral link (format: `https://t.me/SharkBountybot?start=r{UserA_ID}`)

3. **Create Test User B**:
- Open referral link in different browser/device
- Start the bot

4. **Verify**:
- User A's balance increases by 5000 SHB
- User A's referral count shows 1
- User B's data includes `referredBy: UserA_ID`
- Notification created in Firebase


TON Wallet Testing:
1. **Connect Wallet**:
- Go to Profile section
- Click "Connect TON Wallet"
- Select TON Keeper
- Approve connection

2. **Verify**:
- Wallet address displays in profile
- Submission appears in Firebase `admin/tonSubmissions/`
- Push token is included
- Disconnect button appears

3. **Disconnect Wallet**:
- Click "Disconnect" button
- Verify wallet address is cleared
- Connect button reappears


⸻


📊 Monitoring & Analytics

Firebase Console:
• Monitor user registrations
• Track referral activity
• View wallet submissions
• Check task completions


Key Metrics to Track:
• Total users
• Active referrals
• Wallet connections
• Task completion rate
• Ad watch rate


⸻


🐛 Troubleshooting

Referrals Not Working:

**Problem**: Referral count shows 0 or rewards not credited


**Solution**:
1. Check Firebase rules allow read/write
2. Verify referral link format: `https://t.me/SharkBountybot?start=r{userId}`
3. Ensure bot is properly configured with Mini App URL
4. Check browser console for errors


TON Wallet Not Connecting:

**Problem**: Wallet connection fails or doesn't appear


**Solution**:
1. Verify `tonconnect-manifest.json` is deployed
2. Check TON Connect SDK is loaded
3. Ensure HTTPS is enabled (required for TON Connect)
4. Try clearing browser cache


Loading Issues:

**Problem**: App doesn't load or shows errors


**Solution**:
1. Check all files are deployed to Vercel
2. Verify Firebase configuration is correct
3. Check browser console for JavaScript errors
4. Ensure Telegram WebApp SDK is loaded


⸻


🔐 Security Notes

Firebase Security Rules:

{
  "rules": {
    "users": {
      "$uid": {
        ".read": true,
        ".write": true
      }
    },
    "tasks": {
      ".read": true,
      ".write": false
    },
    "profileSections": {
      ".read": true,
      ".write": false
    },
    "redeemCodes": {
      ".read": true,
      ".write": true
    },
    "admin": {
      ".read": true,
      ".write": true
    },
    "notifications": {
      ".read": true,
      ".write": true
    }
  }
}


⸻


📱 Bot Owner Notifications

Referral Notifications:

When a new user joins via referral, a notification is created in Firebase:


notifications/referrals/{notificationId}
{
  referrerId: "123456789",
  newUserId: "987654321",
  newUserName: "邹 嫱",
  timestamp: 1234567890,
  processed: false
}


Your bot can listen to this path and send you Telegram notifications.


Wallet Submission Notifications:

When a user connects their wallet:


admin/tonSubmissions/{submissionId}
{
  userId: "123456789",
  userName: "User Name",
  walletAddress: "UQCOL7arveEVrKfKa9v3SbZnKjIBnOavmX3aXdDV-XD1cQ09",
  pushToken: "ftt5nfzlQG24v6LPVLm_oI:APA91bH...",
  timestamp: 1234567890,
  balance: 50000
}


⸻


🎉 Success Indicators

Your deployment is successful when:


✅ App loads without video animation
✅ Users can tap and earn coins
✅ Referral links generate correctly
✅ Referral count displays accurately
✅ Referral rewards are credited (5000 SHB)
✅ TON wallet connects successfully
✅ Wallet submissions appear in Firebase
✅ All navigation tabs work
✅ Boosters can be purchased
✅ Tasks load and complete
✅ Leaderboard updates in real-time


⸻


📞 Support

If you encounter any issues:

1. Check browser console for errors
2. Verify Firebase database structure
3. Test referral flow with multiple accounts
4. Ensure all files are deployed correctly
5. Check Telegram bot configuration


⸻


🔄 Updates & Maintenance

Regular Maintenance:
• Monitor Firebase usage
• Check for expired redeem codes
• Review user feedback
• Update tasks and profile sections
• Monitor referral activity


Future Enhancements:
• Add more boosters
• Implement achievements system
• Add daily rewards
• Create special events
• Expand task categories


⸻


✨ Key Changes Summary

What's New:
1. **Removed loading video** - Faster app startup
2. **Fixed referral tracking** - Accurate count and rewards
3. **Added TON Wallet** - Full wallet integration
4. **Push notifications** - Admin receives wallet submissions
5. **Improved UI** - Better wallet display and disconnect option


Database Changes:
• Added `referralCount` field to users
• Added `notifications/referrals/` path
• Added `pushToken` to wallet submissions


⸻


🎯 Next Steps
1. **Deploy files to Vercel**
2. **Test referral system** with multiple accounts
3. **Test TON wallet connection**
4. **Monitor Firebase** for submissions
5. **Share referral links** to grow user base


⸻


**Deployment Date**: 2025-10-06
**Version**: 2.0
**Status**: Production Ready ✅


⸻


Good luck with your Shark Bounty app! 🦈💰
