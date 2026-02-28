# Irin Task Board

A Trello-style task management web application with LINE bot integration. Manage tasks on Kanban boards and receive notifications through the LINE chatbot "Irin".

## Features

- 🔐 **LINE Login** - Authenticate with your LINE account
- 📋 **Kanban Boards** - Create boards with customizable lanes
- 🎯 **Task Cards** - Drag-and-drop cards with priority levels
- ✅ **Checklists** - Add checklist items to cards
- 👥 **Task Assignment** - Assign checklist items to team members
- 🤖 **LINE Bot** - Receive notifications and manage tasks via LINE
- 💬 **Bot Commands**:
  - `my tasks` - View your pending tasks
  - `done {taskId}` - Mark a task as completed

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Integration**: LINE Login OAuth, LINE Messaging API
- **Drag & Drop**: dnd-kit

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- LINE Developer Account with:
  - LINE Login Channel (for OAuth)
  - LINE Messaging API Channel (for bot)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd irin-task-board
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/irin_task_board?schema=public"

# LINE Messaging API (Bot)
LINE_CHANNEL_ACCESS_TOKEN="your_line_channel_access_token"
LINE_CHANNEL_SECRET="your_line_channel_secret"

# LINE Login OAuth
LINE_LOGIN_CHANNEL_ID="your_line_login_channel_id"
LINE_LOGIN_CHANNEL_SECRET="your_line_login_channel_secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Session Secret (generate a random string)
SESSION_SECRET="your_session_secret_at_least_32_characters"
```

### 3. Set Up LINE Channels

#### LINE Login Channel

1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create a new Provider (or use existing)
3. Create a **LINE Login** channel
4. Set the Callback URL to: `http://localhost:3000/api/auth/line`
5. Copy the **Channel ID** and **Channel Secret** to `.env.local`

#### LINE Messaging API Channel

1. In the same Provider, create a **Messaging API** channel
2. Go to the **Messaging API** tab
3. Issue a **Channel Access Token** (long-lived)
4. Copy the **Channel Access Token** and **Channel Secret** to `.env.local`
5. Set the Webhook URL to: `http://localhost:3000/api/line/webhook`
   - For local development, use [ngrok](https://ngrok.com/) to expose your local server
6. Enable **Use webhook** and disable **Auto-reply messages**

### 4. Set Up Database

Run Prisma migrations to create the database schema:

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client:

```bash
npx prisma generate
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. (Optional) Use ngrok for LINE Webhook

For local development, you need to expose your local server to the internet for LINE webhook to work:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and:

1. Update `NEXT_PUBLIC_APP_URL` in `.env.local`
2. Update the Webhook URL in LINE Messaging API settings to `https://abc123.ngrok.io/api/line/webhook`
3. Update the Callback URL in LINE Login settings to `https://abc123.ngrok.io/api/auth/line`

## Usage

### Web Application

1. **Login**: Visit the app and click "Sign in with LINE"
2. **Create Board**: Click "New Board" on the dashboard
3. **Add Lanes**: Click "Add Lane" to create columns (e.g., "To Do", "In Progress", "Done")
4. **Add Cards**: Click "Add Card" in any lane
5. **Edit Card**: Click on a card to edit title, description, priority, and checklist
6. **Assign Tasks**: In the card modal, add checklist items and assign them to users
7. **Drag & Drop**: Drag cards between lanes to update their status

### LINE Bot

1. **Add Bot as Friend**: Scan the QR code from your LINE Messaging API channel
2. **View Tasks**: Send `my tasks` to see your pending checklist items
3. **Complete Task**: Send `done {taskId}` to mark a task as done

## Database Schema

- **User**: LINE authenticated users
- **Board**: Task boards
- **Lane**: Columns within boards
- **Card**: Task cards with title, description, priority
- **ChecklistItem**: Checklist items within cards (can be assigned to users)

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (database GUI)
npm run db:studio

# Create database migration
npm run db:migrate

# Push schema changes without migration
npm run db:push
```

## Project Structure

```
irin-task-board/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── boards/       # Board CRUD
│   │   ├── cards/        # Card CRUD
│   │   ├── checklist/    # Checklist CRUD
│   │   ├── lanes/        # Lane CRUD
│   │   ├── line/         # LINE webhook
│   │   └── users/        # User endpoints
│   ├── boards/[id]/      # Board detail page
│   ├── dashboard/        # Dashboard page
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── board-list.tsx    # Board list component
│   ├── card-modal.tsx    # Card edit modal
│   ├── card.tsx          # Draggable card
│   ├── checklist.tsx     # Checklist component
│   ├── kanban-board.tsx  # Kanban board with DnD
│   └── lane.tsx          # Lane component
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── line.ts           # LINE bot utilities
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
└── .env.local            # Environment variables
```

## Notes

- This is a POC/startup project - not production-ready
- No permissions system (all users can see all boards)
- No real-time collaboration
- Session management is simplified (use proper auth in production)

## License

MIT
