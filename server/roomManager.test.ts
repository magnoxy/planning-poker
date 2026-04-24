import { describe, it, expect, beforeEach } from 'vitest';
import { roomManager } from './roomManager';

describe('RoomManager', () => {
  let sessionId: string;
  const adminId = 'admin-1';
  const adminName = 'Admin';

  beforeEach(() => {
    const session = roomManager.createSession(adminId, adminName);
    sessionId = session.id;
  });

  it('should add a task manually', () => {
    const newTask = { title: 'New Task', description: 'Description' };
    const session = roomManager.addTask(sessionId, newTask);
    expect(session?.tasks).toHaveLength(1);
    expect(session?.tasks[0]).toEqual(newTask);
  });

  it('should edit an existing task', () => {
    const task = { title: 'Task 1', description: 'Desc 1' };
    roomManager.updateTasks(sessionId, [task]);
    
    const updatedTask = { title: 'Updated Task', description: 'Updated Desc' };
    const session = roomManager.editTask(sessionId, 0, updatedTask);
    expect(session?.tasks[0]).toEqual(updatedTask);
  });

  it('should remove a task', () => {
    const task = { title: 'Task 1', description: 'Desc 1' };
    roomManager.updateTasks(sessionId, [task]);
    const session = roomManager.removeTask(sessionId, 0);
    expect(session?.tasks).toHaveLength(0);
  });

  it('should start a countdown and then reveal votes', async () => {
    roomManager.startCountdown(sessionId, 100); // 100ms for test
    const sessionBefore = roomManager.getSession(sessionId);
    expect(sessionBefore?.showVotes).toBe(false);

    // Wait for countdown
    await new Promise(resolve => setTimeout(resolve, 150));

    const sessionAfter = roomManager.getSession(sessionId);
    expect(sessionAfter?.showVotes).toBe(true);
  });

  it('should allow a participant to rejoin with the same ID', () => {
    const userId = 'persistent-user-id';
    const userName = 'John Doe';
    
    // Join with initial socket
    roomManager.joinSession(sessionId, { id: userId, name: userName });
    const session1 = roomManager.getSession(sessionId);
    expect(session1?.participants).toContainEqual({ id: userId, name: userName });
    
    // Simulate re-join with same userId (e.g. after refresh)
    // In a real scenario, the roomManager shouldn't care about socket.id for identity
    const session2 = roomManager.joinSession(sessionId, { id: userId, name: userName });
    expect(session2?.participants).toHaveLength(2); // Admin + John
    expect(session2?.participants.filter(p => p.id === userId)).toHaveLength(1);
  });

  it('should allow admin to transfer ownership', () => {
    const userId = 'user-2';
    roomManager.joinSession(sessionId, { id: userId, name: 'User 2' });
    
    const session = roomManager.transferAdmin(sessionId, userId);
    expect(session?.adminId).toBe(userId);
  });
});
