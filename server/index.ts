import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { roomManager } from './roomManager';
import { Participant, Task } from './types';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ name }: { name: string }) => {
    const session = roomManager.createSession(socket.id, name);
    socket.join(session.id);
    socket.emit('sessionUpdated', session);
    console.log(`Room created: ${session.id} by ${name}`);
  });

  socket.on('joinRoom', ({ sessionId, name }: { sessionId: string; name: string }) => {
    const participant: Participant = { id: socket.id, name };
    const session = roomManager.joinSession(sessionId.toUpperCase(), participant);
    if (session) {
      socket.join(session.id);
      io.to(session.id).emit('sessionUpdated', session);
      console.log(`User ${name} joined room ${session.id}`);
    } else {
      socket.emit('error', 'Room not found');
    }
  });

  socket.on('vote', ({ sessionId, value }: { sessionId: string; value: string }) => {
    const session = roomManager.vote(sessionId, socket.id, value);
    if (session) {
      io.to(session.id).emit('sessionUpdated', session);
    }
  });

  socket.on('revealVotes', ({ sessionId }: { sessionId: string }) => {
    const session = roomManager.revealVotes(sessionId);
    if (session) {
      io.to(session.id).emit('sessionUpdated', session);
    }
  });

  socket.on('resetVotes', ({ sessionId }: { sessionId: string }) => {
    const session = roomManager.resetVotes(sessionId);
    if (session) {
      io.to(session.id).emit('sessionUpdated', session);
    }
  });

  socket.on('importTasks', ({ sessionId, tasks }: { sessionId: string; tasks: Task[] }) => {
    const session = roomManager.updateTasks(sessionId, tasks);
    if (session) {
      io.to(session.id).emit('sessionUpdated', session);
    }
  });

  socket.on('nextTask', ({ sessionId, points }: { sessionId: string; points?: string }) => {
    const session = roomManager.getSession(sessionId);
    if (session && session.currentTaskIndex < session.tasks.length - 1) {
      const updatedSession = roomManager.setCurrentTask(sessionId, session.currentTaskIndex + 1, points);
      io.to(sessionId).emit('sessionUpdated', updatedSession);
    }
  });

  socket.on('prevTask', ({ sessionId }: { sessionId: string }) => {
    const session = roomManager.getSession(sessionId);
    if (session && session.currentTaskIndex > 0) {
      const updatedSession = roomManager.setCurrentTask(sessionId, session.currentTaskIndex - 1);
      io.to(sessionId).emit('sessionUpdated', updatedSession);
    }
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        const session = roomManager.leaveSession(room, socket.id);
        if (session) {
          io.to(room).emit('sessionUpdated', session);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
