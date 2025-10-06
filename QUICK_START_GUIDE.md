🚀 Shark Bounty - Quick Start Guide

📦 Files to Deploy

Upload these 2 files to your Vercel project:

1. **index.html** - Main application
2. **tonconnect-manifest.json** - TON wallet configuration


⸻


⚡ Quick Deployment Steps

1. Upload to Vercel

# Go to: https://vercel.com/dashboard
# Select project: shark-silk-two
# Upload: index.html and tonconnect-manifest.json


2. Verify Deployment

Visit: https://shark-silk-two.vercel.app


⸻


✅ What's Fixed

Issue	Status	Solution
Referral not tracking	✅ Fixed	Added `referralCount` field
Referral rewards not adding	✅ Fixed	Auto-credits 5000 SHB
Referral count showing 0	✅ Fixed	Real-time count from Firebase
Loading video animation	✅ Removed	Direct app loading
TON wallet missing	✅ Added	Full TON Keeper integration

⸻


🔗 Referral System

How It Works:
1. User A gets referral link: `https://t.me/SharkBountybot?start=r{UserA_ID}`
2. User B clicks link and starts bot
3. **Automatic actions**:
- User A receives 5000 SHB
- User A's referral count increases by 1
- User B's account linked to User A
- Notification sent to Firebase


Testing:

1. Open bot → Go to Profile → Copy referral link
2. Open link in new browser/device
3. Check Profile → Referral count should show 1
4. Check balance → Should increase by 5000 SHB


⸻


💰 TON Wallet Integration

Features:
• ✅ Connect TON Keeper wallet
• ✅ Display wallet address
• ✅ Disconnect option
• ✅ Auto-submit to Firebase with push token


Push Token:

ftt5nfzlQG24v6LPVLm_oI:APA91bH6IgQli0wfh71lj1CM2j8idCB6KMj9tPg4Lo1qaIFUane5r68S-pLN9JnoATjhdxL_pT5XWdSuQyyTmBc6dCYamvSTjxVme6DooclgH7pmhKdA5-0


Test Wallet:

UQCOL7arveEVrKfKa9v3SbZnKjIBnOavmX3aXdDV-XD1cQ09


⸻


🎮 App Features

Home
• Tap to earn coins
• Multi-finger tapping (up to 4 fingers)
• Energy system (auto-recovers)
• Real-time balance


Booster
• Max Energy: +500 per upgrade (10 max)
• Multi-Tap: +1 finger per upgrade (3 max)
• Passive Income: 1 SHB per 10 seconds


Earn
• Watch ads: 500 SHB per ad
• Complete tasks: Variable rewards
• Ad statistics tracking


Profile
• User info display
• **TON Wallet connection** ⭐ NEW
• **Referral system** ⭐ FIXED
• Redeem codes
• Profile sections


Ranking
• Top 200 leaderboard
• Your position
• Real-time updates


⸻


🔍 Quick Test

Test Referrals:

1. Open app → Profile → Copy referral link
2. Open link in incognito/different device
3. Check original account:
   - Balance: +5000 SHB
   - Referral count: 1


Test TON Wallet:

1. Profile → Click "Connect TON Wallet"
2. Select TON Keeper → Approve
3. Verify:
   - Wallet address shows
   - Disconnect button appears
   - Firebase has submission


⸻


📊 Firebase Paths

Check These Paths:

users/{userId}/referralCount → Should increment
users/{userId}/referredBy → Should show referrer ID
notifications/referrals/ → New referral notifications
admin/tonSubmissions/ → Wallet submissions with push token


⸻


🐛 Common Issues

Referrals Not Working?
• Check bot start parameter format: `start=r{userId}`
• Verify Firebase allows read/write
• Test with different accounts


Wallet Not Connecting?
• Ensure HTTPS is enabled
• Check tonconnect-manifest.json is deployed
• Try clearing browser cache


⸻


📱 Bot Configuration

Required Settings:

Bot: @SharkBountybot
Mini App URL: https://shark-silk-two.vercel.app
Referral Format: https://t.me/SharkBountybot?start=r{userId}


⸻


✨ Key Improvements

Before → After:
• ❌ Loading video → ✅ Direct loading
• ❌ Referrals not tracked → ✅ Real-time tracking
• ❌ No wallet integration → ✅ Full TON Connect
• ❌ Manual wallet entry → ✅ One-click connect
• ❌ No push notifications → ✅ Auto-notifications


⸻


🎯 Success Checklist
• Files uploaded to Vercel
• App loads without video
• Referral link generates correctly
• Referral count displays accurately
• Referral rewards credited (5000 SHB)
• TON wallet connects
• Wallet submissions in Firebase
• All tabs working
• Boosters purchasable
• Tasks loading


⸻


📞 Need Help?
1. Check browser console for errors
2. Verify Firebase database structure
3. Test with multiple accounts
4. Review DEPLOYMENT_INSTRUCTIONS.md for details


⸻


**Version**: 2.0
**Status**: Ready to Deploy ✅
**Last Updated**: 2025-10-06


Deploy now and start earning! 🦈💰
