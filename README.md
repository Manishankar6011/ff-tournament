# FF Tournament Platform 🎮🔥

> **Free Fire Tournament Platform** — India ka #1 competitive Free Fire tournament website.
> Players join karte hain, tournaments khelte hain, aur real prizes jeette hain!

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| Auth | Supabase Auth (Phone OTP + Email/Password) |
| Payments | Razorpay (Sandbox) |
| Styling | Tailwind CSS |
| Hosting | Vercel |

## Setup Guide

### 1. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in the values from Supabase Dashboard and Razorpay Dashboard.

### 2. Database Setup

```bash
# Generate Prisma migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 3. Admin User Setup

1. Create user in Supabase Dashboard → Authentication → Users
2. Open `npx prisma studio`
3. Add row in `users` table with that user's `supabase_id` and `role = admin`

### 4. Run Locally

```bash
npm run dev
```

- **Player App:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin/login

## User Journey (Player)

```
Phone OTP Login → Profile Setup → Tournament List → Join Tournament
→ Room Released (notification) → Play Match → See Results → Withdraw Prize
```

## Admin Journey

```
Admin Login → Dashboard → Create Tournament → Monitor Slots
→ Release Room → Enter Results → Publish → Manage Withdrawals
```

## Prize Calculation

```
Total Points = Placement Points + (Kills × per_kill_point)
Prize = (Prize Pool × rank_percentage / 100) + (Kills × per_kill_reward)
```
