import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Session } from '../types';

const SOCKET_SERVER_URL = import.meta.env.VITE_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.on('sessionUpdated', (updatedSession: Session) => {
      setSession(updatedSession);
    });

    socketRef.current.on('error', (message: string) => {
      setError(message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const createRoom = (name: string) => {
    socketRef.current?.emit('createRoom', { name });
  };

  const joinRoom = (sessionId: string, name: string) => {
    socketRef.current?.emit('joinRoom', { sessionId, name });
  };

  const vote = (sessionId: string, value: string) => {
    socketRef.current?.emit('vote', { sessionId, value });
  };

  const revealVotes = (sessionId: string) => {
    socketRef.current?.emit('revealVotes', { sessionId });
  };

  const resetVotes = (sessionId: string) => {
    socketRef.current?.emit('resetVotes', { sessionId });
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

  return {
    socketId: socketRef.current?.id,
    session,
    error,
    createRoom,
    joinRoom,
    vote,
    revealVotes,
    resetVotes,
    importTasks,
    nextTask,
    prevTask,
    setError,
  };
};
