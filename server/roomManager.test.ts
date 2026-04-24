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
});
