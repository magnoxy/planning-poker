import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket';
import { Socket } from 'socket.io-client';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  id: 'test-socket-id',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add a task manually', () => {
    const { result } = renderHook(() => useSocket());
    const newTask = { title: 'New Task', description: 'Desc' };
    const sessionId = 'TEST-123';

    act(() => {
      result.current.addTask(sessionId, newTask);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('addTask', { sessionId, task: newTask });
  });

  it('should edit a task', () => {
    const { result } = renderHook(() => useSocket());
    const updatedTask = { title: 'Updated Task', description: 'Updated Desc' };
    const sessionId = 'TEST-123';
    const index = 0;

    act(() => {
      result.current.editTask(sessionId, index, updatedTask);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('editTask', { sessionId, index, task: updatedTask });
  });
});
