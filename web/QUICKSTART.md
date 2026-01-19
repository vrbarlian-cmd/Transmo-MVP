# Quick Start Guide - Transmo MVP

## Installation & Setup

1. **Navigate to web directory**
```bash
cd web
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## Demo Login

For MVP testing, use the demo login:

1. Go to `/auth` page
2. Enter any phone number (e.g., `+6281234567890`)
3. Click "Send OTP"
4. Enter any 6-digit code (e.g., `123456`)
5. You'll be logged in as "John Doe" with mock data

## Features to Test

### 1. Social Feed (`/home`)
- View transaction feed
- Like transactions (❤️)
- View comments
- See transaction privacy settings

### 2. Pay/Request (`/pay`)
- Enter payment amount
- Search for recipients
- Add emoji notes
- Select privacy (Public/Friends/Private)
- Choose payment method (Wallet/QRIS/Bank VA/E-Wallet)

### 3. Profile (`/profile`)
- View wallet balance
- Check transaction history
- View friends list
- See KYC status

## Navigation

Use the bottom navigation bar:
- **Home** - Social feed
- **Pay** - Send/Request payments
- **Profile** - User profile

## Payment Methods (Mock)

The MVP includes mock implementations for:
- **Wallet Balance** - Instant internal transfers
- **QRIS** - Quick Response Code Indonesian Standard
- **Bank Virtual Accounts** - BCA, Mandiri, BRI, BNI, CIMB
- **E-Wallets** - GoPay, OVO, DANA, ShopeePay

## Mock Data

The app comes with pre-populated mock data:
- 4 demo users (John Doe, Jane Smith, Budi Kurniawan, Sari Dewi)
- Sample transactions with likes and comments
- Various payment methods and privacy settings

## UI/UX Features

- ✅ Venmo-inspired design (light blue & white theme)
- ✅ Smooth animations with Framer Motion
- ✅ Mobile-first responsive design
- ✅ Bottom navigation bar
- ✅ Emoji support in transaction notes
- ✅ Social interactions (likes & comments)
- ✅ Privacy controls per transaction

## Development Notes

- All data is stored in memory (Zustand stores)
- API endpoints are mocked in `/app/api` routes
- Images use external CDN (pravatar.cc, dicebear.com)
- No database required for MVP testing

## Next Steps for Production

1. Integrate real payment gateways (Midtrans, Xendit)
2. Set up database (PostgreSQL/MongoDB)
3. Implement real OTP service (Twilio, etc.)
4. Add proper authentication (JWT, sessions)
5. Set up file storage for profile photos
6. Implement real-time notifications
7. Add proper error handling and logging
8. Set up CI/CD pipeline

## Troubleshooting

**Port already in use?**
```bash
# Use a different port
npm run dev -- -p 3001
```

**Dependencies issues?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors?**
```bash
# Clean build
rm -rf .next
npm run build
```

## Support

For issues or questions, check the main README.md or open an issue on the repository.

---

**Happy Testing! 🚀**