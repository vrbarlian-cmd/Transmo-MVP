# Transmo - P2P Payment App for Indonesia

A Venmo-inspired peer-to-peer payment application designed specifically for Indonesia, supporting QRIS, bank virtual accounts, and e-wallets.

## Features

### Core Features
- 📱 **Mobile-First Design** - Optimized for mobile devices with responsive web interface
- 💰 **P2P Payments** - Send and receive money instantly
- 📊 **Social Feed** - Public transaction feed with likes and comments
- 🔒 **Privacy Controls** - Public, Friends-only, or Private transactions
- 👥 **Friend System** - Add and manage friends
- 💳 **Indonesian Payment Methods**:
  - QRIS (Quick Response Code Indonesian Standard)
  - Bank Virtual Accounts (BCA, Mandiri, BRI, BNI, CIMB)
  - E-Wallets (GoPay, OVO, DANA, ShopeePay)

### UI/UX Features
- 🎨 Venmo-inspired design (light blue & white theme)
- ⚡ Smooth animations and transitions
- 📱 Bottom navigation bar
- 🎭 Emoji support in transaction notes
- 💬 Social interactions (likes & comments)

## Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form
- **Icons**: React Icons
- **Emoji Picker**: Emoji Picker React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Mode

For MVP testing, the app runs in demo mode:
- Enter any phone number on the auth page
- Use OTP code: `123456` (or any 6 digits)
- You'll be logged in as a demo user with mock data

## Project Structure

```
web/
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── auth/            # Authentication page
│   ├── home/            # Feed/Home page
│   ├── pay/             # Pay/Request page
│   ├── profile/         # Profile page
│   └── layout.tsx       # Root layout
├── components/          # React components
│   ├── payments/        # Payment method components
│   ├── BottomNav.tsx    # Bottom navigation
│   ├── TransactionCard.tsx
│   └── ...
├── lib/                 # Utilities
│   ├── api.ts          # API client
│   └── store.ts        # Zustand stores
├── types/               # TypeScript types
└── public/              # Static assets
```

## Features in Detail

### Authentication
- Phone number + OTP verification
- Session management with Zustand
- Protected routes

### Social Feed
- Transaction feed with sender/recipient info
- Like and comment functionality
- Privacy filtering
- Real-time updates (mock for MVP)

### Payment Flow
1. **Amount Input** - Enter payment amount
2. **Recipient Search** - Search by name, username, or phone
3. **Note with Emoji** - Add description with emoji picker
4. **Privacy Selection** - Choose transaction visibility
5. **Payment Method** - Select QRIS, Bank VA, or E-Wallet
6. **Processing** - Payment processing simulation

### Profile
- User information and wallet balance
- Transaction history
- Friends list
- KYC status

## Payment Integration (Production)

For production deployment, integrate with Indonesian payment providers:

### QRIS
- **Midtrans**: [https://midtrans.com](https://midtrans.com)
- **Xendit**: [https://xendit.co](https://xendit.co)

### Bank Virtual Accounts
- Support BCA, Mandiri, BRI, BNI, CIMB
- Integrate via payment gateway APIs

### E-Wallets
- GoPay, OVO, DANA, ShopeePay
- Partner with respective providers or use aggregators

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/me` - Get current user

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `POST /api/transactions/:id/like` - Like transaction
- `POST /api/transactions/:id/comment` - Comment on transaction

### Payments
- `POST /api/payments/qris` - Generate QRIS code
- `POST /api/payments/va` - Create virtual account
- `POST /api/payments/ewallet` - Process e-wallet payment

## Compliance & Security

### KYC Requirements
- Basic: Name, Phone
- Optional: ID verification for higher limits
- Tiered verification system

### Security Features
- Encrypted data storage (to be implemented)
- Transaction limits
- OTP verification
- Session management

### Regulatory Compliance
- Follow OJK (Otoritas Jasa Keuangan) regulations
- Follow BI (Bank Indonesia) guidelines
- Implement proper transaction logging

## Future Enhancements

- 🔄 Bill splitting
- 👥 Group payments
- 🏪 Merchant payments
- 📊 Analytics dashboard
- 🔔 Push notifications
- 🌐 Multi-language support
- 💾 Database integration (PostgreSQL/MongoDB)
- 🔐 Advanced security features
- 📱 Native mobile apps (React Native)

## Development

### Build for Production

```bash
npm run build
npm start
```

### Code Style

- TypeScript strict mode enabled
- ESLint configured
- Prettier (recommended)

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open an issue on the repository.

---

**Note**: This is an MVP version for testing purposes. Production deployment requires integration with actual payment gateways, database setup, and security hardening.