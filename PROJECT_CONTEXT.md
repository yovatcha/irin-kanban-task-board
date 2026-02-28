# Project: Irin Task Board (Trello-style with LINE Bot)

## Overview

Build a lightweight internal task management web application similar to Trello.
The system allows teams to manage tasks on boards and receive notifications through a LINE chatbot named **Irin**.

This project is a **POC + startup group project**, so focus on:

- Clean structure
- Working core features
- Simple UI (not production scale)

---

# Tech Stack

Frontend:

- Next.js (App Router)
- TypeScript
- shadcn/ui
- Tailwind CSS
- dnd-kit (drag & drop)

Backend:

- Next.js API routes
- Prisma ORM
- PostgreSQL

Integration:

- LINE Login (OAuth)
- LINE Messaging API (Bot: Irin)

Architecture:

- Monorepo
- Single Next.js project

---

# Core Features

## Authentication

Users must log in using LINE Login.

Store:

- lineUserId
- displayName
- pictureUrl

---

## Board System

Users can:

### Boards

- Create board
- View board

### Lanes

- Create lane
- Rename lane
- Reorder lanes

### Cards

Each card has:

- Title
- Description
- Priority (Low, Medium, High)
- Order index

Cards must be draggable between lanes.

---

## Checklist System

Each card can contain checklist items.

Checklist item fields:

- Text
- Completed (boolean)
- Assigned user (optional)

Assigned user must reference a LINE-authenticated user.

---

## Bot Integration (Irin)

When:

- A checklist item is assigned to a user

System must:

- Send a LINE push message to that user

Example message:
"You have been assigned a task: {cardTitle}"

---

## Chatbot Commands

Webhook endpoint:
`/api/line/webhook`

Supported commands:

my tasks
→ Returns all incomplete checklist items assigned to that user.

done {taskId}
→ Marks checklist item as completed.

---

# Database Schema (Initial)

User

- id
- lineUserId (unique)
- name
- avatarUrl
- createdAt

Board

- id
- name
- createdAt

Lane

- id
- boardId
- title
- order

Card

- id
- laneId
- title
- description
- priority
- order

ChecklistItem

- id
- cardId
- text
- completed
- assignedToUserId (nullable)

---

# API Routes

/api/auth/line
Handle LINE login callback

/api/boards
CRUD boards

/api/cards
CRUD cards

/api/checklist
Update checklist items

/api/line/webhook
Handle LINE bot events

---

# UI Requirements

Board page:

- Kanban layout
- Drag & drop cards
- Modal to edit card
- Checklist inside card

Use shadcn components where possible.

---

# Environment Variables

DATABASE_URL=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
LINE_LOGIN_CHANNEL_ID=
LINE_LOGIN_CHANNEL_SECRET=

---

# Non-Goals (for POC)

Do NOT implement:

- Permissions system
- Multiple organizations
- Advanced filtering
- Real-time collaboration

---

# Expected Outcome

A working web app where:

1. User logs in with LINE
2. User creates board and tasks
3. Assigns a checklist item to another user
4. Assigned user receives LINE notification
5. User can type "my tasks" in LINE and see tasks
