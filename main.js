const { app, BrowserWindow,ipcMain } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec } = require('child_process');

const users = {}; // Object to track connected users

// Server setup
function createServer() {
  const serverApp = express();
  const server = http.createServer(serverApp);
  const io = socketIo(server);

  serverApp.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    users[socket.id] = socket;

    // Notify all clients about the new connection
    io.emit('update users', Object.keys(users));

    socket.on('chat message', (msg) => {
      console.log('Message:', msg);
      io.emit('chat message', msg);
    });

    socket.on('private message', ({ recipientId, message }) => {
      console.log(`Private message from ${socket.id} to ${recipientId}: ${message}`);
      if (users[recipientId]) {
        users[recipientId].emit('private message', { from: socket.id, message });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      delete users[socket.id];

      // Notify all clients about the disconnection
      io.emit('update users', Object.keys(users));
    });
  });

  server.listen(3000, () => {
    console.log('Server listening on port 3000');
  });
}

// Electron window setup
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      // nodeIntegration: false, // to use contextBridge for security
      contextIsolation: true, // to use contextBridge for security
    }
  });

  // Create the resources directory if it doesn't exist
  // const resourcesPath = path.join(app.getAppPath(), 'resources');
  // fs.ensureDirSync(resourcesPath);

  // Copy socket.io.js to the resources directory
  // const srcPath = path.join(__dirname, 'node_modules', 'socket.io', 'client-dist', 'socket.io.js');
  // const destPath = path.join(resourcesPath, 'socket.io.js');
  // fs.copyFileSync(srcPath, destPath);

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // mainWindow.webContents.openDevTools();

  ipcMain.on('open-notepad', () => {
    exec('notepad.exe', (err) => {
      if (err) {
        console.error('Failed to open Notepad:', err);
      }
    });
  });
}

app.whenReady().then(() => {
  createServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});