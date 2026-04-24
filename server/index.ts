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

roomManager.onSessionUpdated = (session) => {
  io.to(session.id).emit('sessionUpdated', session);
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ name, userId }: { name: string; userId: string }) => {
    const session = roomManager.createSession(userId, name);
    socket.join(session.id);
    socket.emit('sessionUpdated', session);
    console.log(`Room created: ${session.id} by ${name} (${userId})`);
  });

  socket.on('joinRoom', ({ sessionId, name, userId }: { sessionId: string; name: string; userId: string }) => {
    const participant: Participant = { id: userId, name };
    const session = roomManager.joinSession(sessionId.toUpperCase(), participant);
    if (session) {
      socket.join(session.id);
      io.to(session.id).emit('sessionUpdated', session);
      console.log(`User ${name} joined room ${session.id}`);
    } else {
      socket.emit('error', 'Room not found');
    }
    });

    socket.on('vote', ({ sessionId, userId, value }: { sessionId: string; userId: string; value: string }) => {
    const session = roomManager.vote(sessionId, userId, value);
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

  socket.on('startCountdown', ({ sessionId, durationMs }: { sessionId: string; durationMs?: number }) => {
    roomManager.startCountdown(sessionId, durationMs);
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

  socket.on('addTask', ({ sessionId, task }: { sessionId: string; task: Task }) => {
    const session = roomManager.addTask(sessionId, task);
    if (session) {
      io.to(session.id).emit('sessionUpdated', session);
    }
  });

  socket.on('editTask', ({ sessionId, index, task }: { sessionId: string; index: number; task: Task }) => {
    const session = roomManager.editTask(sessionId, index, task);
    if (session) {
      io.to(session.id).emit('sessionUpdated', session);
    }
  });

  socket.on('removeTask', ({ sessionId, index }: { sessionId: string; index: number }) => {
    const session = roomManager.removeTask(sessionId, index);
    if (session) {
      io.to(session.id).emit('sessionUpdated', session);
    }
  });

  socket.on('proposeAdminTransfer', ({ sessionId, targetUserId }: { sessionId: string; targetUserId: string }) => {
    const session = roomManager.proposeAdminTransfer(sessionId, targetUserId);
    if (session) {
      io.to(session.id).emit('sessionUpdated', session);
    }
  });

  socket.on('acceptAdminTransfer', ({ sessionId, userId }: { sessionId: string; userId: string }) => {
    const session = roomManager.acceptAdminTransfer(sessionId, userId);
    if (session) {
      io.to(session.id).emit('sessionUpdated', session);
    }
  });

  socket.on('declineAdminTransfer', ({ sessionId }: { sessionId: string }) => {
    const session = roomManager.getSession(sessionId);
    if (session) {
      session.pendingAdminId = undefined;
      io.to(session.id).emit('sessionUpdated', session);
    }
  });

  socket.on('disconnecting', () => {
    /* 
    Keep participants even after disconnect for session persistence.
    They will be recognized by their persistent userId when rejoining.
    */
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
