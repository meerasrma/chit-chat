// Socket.IO connection
const SOCKET_URL = "http://localhost:8080";
let socket;
let currentStatus = "disconnected"; // disconnected, waiting, chatting
let partnerUsername = ""; // Store the partner's username

// DOM Elements
const statusIndicator = document.getElementById("status-indicator");
const statusText = document.getElementById("status-text");
const actionButton = document.getElementById("action-button");
const messagesContainer = document.getElementById("messages-container");
const emptyState = document.getElementById("empty-state");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const usernameModal = document.getElementById("username-modal");
const usernameForm = document.getElementById("username-form");
const usernameInput = document.getElementById("username-input");

// Initialize socket connection
function initSocket() {
    socket = io(SOCKET_URL, { transports: ["websocket"] });

    // Connection events
    socket.on("connect", () => {
        console.log("Connected to server");
        updateStatus("disconnected", "Set a username to start chatting");
        showUsernameModal();
    });

    socket.on("disconnect", () => {
        console.log("Disconnected from server");
        updateStatus("disconnected", "Connection lost. Please refresh the page.");
    });

    // Username events
    socket.on("username_set", (data) => {
        if (data.success) {
            usernameModal.style.display = "none";
            updateStatus("disconnected", "Click 'New Chat' to start chatting with a stranger");
        }
    });

    // Chat events
    socket.on("waiting", (data) => {
        updateStatus("waiting", data.message);
        clearMessages();
    });

    socket.on("chat_started", (data) => {
        partnerUsername = data.partnerUsername || "Stranger";
        updateStatus("chatting", data.message);
        clearMessages();
        emptyState.textContent = `Say hello to ${partnerUsername}!`;
        emptyState.style.display = "block";
    });

    socket.on("receive_message", (data) => {
        // Use the username sent with the message, or fall back to stored partner username
        const messageUsername = data.username || partnerUsername || "Stranger";
        addMessage(data.message, "stranger", data.timestamp, messageUsername);
        emptyState.style.display = "none";
    });

    socket.on("chat_ended", (data) => {
        updateStatus("disconnected", data.message);
        partnerUsername = ""; // Reset partner username
    });

    socket.on("error", (data) => {
        console.error("Socket error:", data.message);
        updateStatus(currentStatus, `Error: ${data.message}`);
    });
}

// Show username modal
function showUsernameModal() {
    usernameModal.style.display = "flex";
    usernameInput.focus();
}

// Update the UI based on connection status
function updateStatus(status, message) {
    currentStatus = status;
    statusIndicator.className = `status-indicator ${status}`;
    statusText.textContent = message;

    // Update action button
    if (status === "disconnected") {
        actionButton.textContent = "New Chat";
        actionButton.className = "primary-button";
        messageInput.disabled = true;
        messageInput.placeholder = "Connect to start chatting";
        sendButton.disabled = true;
    } else if (status === "waiting") {
        actionButton.textContent = "Cancel";
        actionButton.className = "secondary-button";
        messageInput.disabled = true;
        messageInput.placeholder = "Waiting for a partner...";
        sendButton.disabled = true;
    } else if (status === "chatting") {
        actionButton.textContent = "End Chat";
        actionButton.className = "secondary-button";
        messageInput.disabled = false;
        messageInput.placeholder = "Type a message...";
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// Add a message to the chat
function addMessage(text, sender, timestamp, username = null) {
    // Hide empty state if it's visible
    emptyState.style.display = "none";

    // Create message elements
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "message-bubble";

    // Add username label if provided (for stranger messages)
    if (username && sender === "stranger") {
        const usernameLabel = document.createElement("div");
        usernameLabel.className = "message-username";
        usernameLabel.textContent = username;
        bubbleDiv.appendChild(usernameLabel);
    }

    const messageText = document.createElement("p");
    messageText.textContent = text;

    const timeSpan = document.createElement("span");
    timeSpan.className = "timestamp";
    timeSpan.textContent = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Assemble message
    bubbleDiv.appendChild(messageText);
    bubbleDiv.appendChild(timeSpan);
    messageDiv.appendChild(bubbleDiv);

    // Add to container
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Clear all messages
function clearMessages() {
    while (messagesContainer.firstChild) {
        if (messagesContainer.firstChild === emptyState) {
            break;
        }
        messagesContainer.removeChild(messagesContainer.firstChild);
    }
    emptyState.style.display = "block";
}

// Username form submission
usernameForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    if (!username) return;

    // Send username to server
    socket.emit("set_username", { username });
});

// Action button click (New Chat / End Chat / Cancel)
actionButton.addEventListener("click", () => {
    if (currentStatus === "disconnected") {
        // Start new chat
        socket.emit("start_chat");
        updateStatus("waiting", "Looking for someone to chat with...");
    } else if (currentStatus === "waiting") {
        // Cancel search
        socket.emit("disconnect_chat");
        updateStatus("disconnected", "Chat search cancelled");
    } else if (currentStatus === "chatting") {
        // End current chat
        socket.emit("disconnect_chat");
    }
});

// Send message form submission
messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (!message || currentStatus !== "chatting") return;

    // Add message to chat
    addMessage(message, "me", new Date().toISOString());

    // Send to server
    socket.emit("send_message", { message });

    // Clear input
    messageInput.value = "";
});

// Initialize everything when the page loads
window.addEventListener("load", () => {
    initSocket();
});