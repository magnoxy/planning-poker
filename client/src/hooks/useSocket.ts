import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Session } from '../types';

const SOCKET_SERVER_URL = import.meta.env.VITE_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

const SESSION_KEY = 'planning_poker_session';
const USER_ID_KEY = 'planning_poker_user_id';

const getUserId = () => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = getUserId();

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.on('sessionUpdated', (updatedSession: Session) => {
      setSession(updatedSession);
      // Save session info for recovery
      const me = updatedSession.participants.find(p => p.id === userId);
      if (me) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          sessionId: updatedSession.id,
          userName: me.name,
          userId: userId
        }));
      }
    });

    socketRef.current.on('error', (message: string) => {
      setError(message);
    });

    // Attempt recovery
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      const { sessionId, userName } = JSON.parse(savedSession);
      socketRef.current.emit('joinRoom', { sessionId, name: userName, userId });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  const createRoom = (name: string) => {
    socketRef.current?.emit('createRoom', { name, userId });
  };

  const joinRoom = (sessionId: string, name: string) => {
    socketRef.current?.emit('joinRoom', { sessionId, name, userId });
  };

  const vote = (sessionId: string, value: string) => {
    socketRef.current?.emit('vote', { sessionId, userId, value });
  };

  const revealVotes = (sessionId: string) => {
    socketRef.current?.emit('revealVotes', { sessionId });
  };

  const resetVotes = (sessionId: string) => {
    socketRef.current?.emit('resetVotes', { sessionId });
  };

  const revealWithCountdown = (sessionId: string, durationMs: number = 3000) => {
    socketRef.current?.emit('startCountdown', { sessionId, durationMs });
  };

  const importTasks = (sessionId: string, tasks: any[]) => {
    socketRef.current?.emit('importTasks', { sessionId, tasks });
  };

  const nextTask = (sessionId: string, points?: string) => {
    socketRef.current?.emit('nextTask', { sessionId, points });
  };

  const prevTask = (sessionId: string) => {
    socketRef.current?.emit('prevTask', { sessionId });
  };

  const addTask = (sessionId: string, task: Task) => {
    socketRef.current?.emit('addTask', { sessionId, task });
  };

  const editTask = (sessionId: string, index: number, task: Task) => {
    socketRef.current?.emit('editTask', { sessionId, index, task });
  };

  const removeTask = (sessionId: string, index: number) => {
    socketRef.current?.emit('removeTask', { sessionId, index });
  };

  const proposeAdminTransfer = (sessionId: string, targetUserId: string) => {
    socketRef.current?.emit('proposeAdminTransfer', { sessionId, targetUserId });
  };

  const acceptAdminTransfer = (sessionId: string) => {
    socketRef.current?.emit('acceptAdminTransfer', { sessionId, userId });
  };

  const declineAdminTransfer = (sessionId: string) => {
    socketRef.current?.emit('declineAdminTransfer', { sessionId });
  };

  return {
    socketId: socketRef.current?.id,
    userId,
    session,
    error,
    createRoom,
    joinRoom,
    vote,
    revealVotes,
    resetVotes,
    revealWithCountdown,
    importTasks,
    nextTask,
    prevTask,
    addTask,
    editTask,
    removeTask,
    proposeAdminTransfer,
    acceptAdminTransfer,
    declineAdminTransfer,
    setError,
  };
};
