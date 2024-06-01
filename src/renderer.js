const socket = io('http://192.168.0.18:3000');

const chatWindow = document.getElementById('chat-window');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const usersList = document.getElementById('users-list');
let selectedUser = null; // Track selected user for private message

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    if (selectedUser) {
      socket.emit('private message', { recipientId: selectedUser, message });
      openNotepad();
      displayMessage(`You (private to ${selectedUser}): ${message}`, 'private');
    } else {
      socket.emit('chat message', message);
      openNotepad(); // Open Notepad when a message is sent
    }
    messageInput.value = '';
  }
}

socket.on('chat message', (msg) => {
  displayMessage(msg);
});

socket.on('private message', ({ from, message }) => {
  displayMessage(`Private from ${from}: ${message}`, 'private');
});

socket.on('update users', (users) => {
  usersList.innerHTML = ''; // Clear existing user list
  users.forEach((userId) => {
    if (userId !== socket.id) { // Don't include self in the list
      const userElement = document.createElement('div');
      userElement.textContent = userId;
      userElement.classList.add('user-item');
      userElement.addEventListener('click', () => {
        selectedUser = userId;
        console.log(`Selected user: ${selectedUser}`);
        document.querySelectorAll('.user-item').forEach(item => item.classList.remove('selected'));
        userElement.classList.add('selected');
      });
      usersList.appendChild(userElement);
    }
  });

  // Add an option to switch back to group chat
  const groupChatElement = document.createElement('div');
  groupChatElement.textContent = 'Group Chat';
  groupChatElement.classList.add('user-item', 'group-chat-item');
  groupChatElement.addEventListener('click', () => {
    selectedUser = null;
    console.log('Switched to group chat');
    document.querySelectorAll('.user-item').forEach(item => item.classList.remove('selected'));
    groupChatElement.classList.add('selected');
  });
  usersList.appendChild(groupChatElement);
});

function displayMessage(message, type = 'normal') {
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  if (type === 'private') {
    messageElement.style.fontStyle = 'italic';
    messageElement.style.color = 'blue';
  }
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Open Notepad function
function openNotepad() {
  fetch('http://192.168.0.18:3000/open-notepad', { method: 'POST' })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to open Notepad');
      }
    })
    .catch(error => {
      console.error('Error opening Notepad:', error);
    });
}
