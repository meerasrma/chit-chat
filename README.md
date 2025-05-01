# Group Chat Application

A real-time group chat application built with Node.js, Express, and Socket.IO. It allows users to communicate in different chat rooms, send private messages, use emojis, and more!

## Features (some features are pending)

- **Real-time Chat**: Users can send and receive messages instantly.
- **Private Messaging**: Users can send messages directly to other users.
- **Chat Rooms**: Users can join or create chat rooms to communicate with specific groups.
- **Emojis Support**: Add fun with emojis during conversations.
- **Typing Indicators**: See when someone is typing a message.
- **Message History**: Stay connected with your message history.

## Tech Stack

- **Backend**: Node.js, Express.js
- **WebSocket**: Socket.IO
- **Frontend**: HTML, CSS, JavaScript (Plain)
- **Database**: Optional (can be integrated later for storing messages, users, and room data)

## Getting Started

### Prerequisites

- Node.js and npm installed on your system.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/meerasrma/chit-chat.git
   cd chit-chat\server
   ```
2. Install dependencies:
 ```bash
   npm install
   npm install express socket.io
 ```
3. Start the application:
 ```bash
   npm start
 ```
4. Run the app in development mode:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to http://localhost:8080 to access the app.
```bash
chit-chat/
├── public/             # Frontend files (HTML, CSS, JS)
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── src/                # Backend logic (Node.js, Express, Socket.IO)
│   ├── server.js   # All logics are in this file            
|   ├── node_modules/
|   ├── package-lock.json
|   ├── package.json
├── .gitignore
└── README.md
```


Made by Meera Sharma.
live:
frontend:[https://chit-chat-tau-ten.vercel.app/]
backend: [https://chit-chat-1-yqbf.onrender.com]

