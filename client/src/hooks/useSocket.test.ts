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

  it('should remove a task', () => {
    const { result } = renderHook(() => useSocket());
    const sessionId = 'TEST-123';
    const index = 0;

    act(() => {
      result.current.removeTask(sessionId, index);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('removeTask', { sessionId, index });
  });

  it('should start a countdown for reveal', () => {
    const { result } = renderHook(() => useSocket());
    const sessionId = 'TEST-123';

    act(() => {
      result.current.revealWithCountdown(sessionId);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('startCountdown', { sessionId, durationMs: 3000 });
  });

  it('should save session to localStorage when joined', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const mockUserId = 'test-user-id';
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'planning_poker_user_id') return mockUserId;
      return null;
    });

    const { result } = renderHook(() => useSocket());
    
    // Simulate socket emitting sessionUpdated
    const mockSession = { 
      id: 'ROOM-1', 
      adminId: 'u1', 
      participants: [{ id: mockUserId, name: 'Test User' }], 
      tasks: [], 
      votes: {}, 
      showVotes: false 
    };
    
    act(() => {
      // Find the handler for sessionUpdated and call it
      const handler = mockSocket.on.mock.calls.find(call => call[0] === 'sessionUpdated')[1];
      handler(mockSession);
    });

    expect(setItemSpy).toHaveBeenCalledWith('planning_poker_session', JSON.stringify({
      sessionId: mockSession.id,
      userName: 'Test User',
      userId: mockUserId
    }));
  });
});
