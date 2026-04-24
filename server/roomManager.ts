import { Session, Task, Participant } from './types';

class RoomManager {
  private sessions: Map<string, Session> = new Map();
  private countdownIntervals: Map<string, NodeJS.Timeout> = new Map();
  public onSessionUpdated?: (session: Session) => void;

  createSession(adminId: string, adminName: string): Session {
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const session: Session = {
      id: sessionId,
      adminId,
      tasks: [],
      currentTaskIndex: 0,
      participants: [{ id: adminId, name: adminName }],
      votes: {},
      showVotes: false,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  joinSession(sessionId: string, participant: Participant): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (!session.participants.find(p => p.id === participant.id)) {
        session.participants.push(participant);
      }
      return session;
    }
    return undefined;
  }

  leaveSession(sessionId: string, participantId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.participants = session.participants.filter(p => p.id !== participantId);
      delete session.votes[participantId];
      if (session.participants.length === 0) {
        this.sessions.delete(sessionId);
        return undefined;
      }
      return session;
    }
    return undefined;
  }

  updateTasks(sessionId: string, tasks: Task[]): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.tasks = tasks;
      session.currentTaskIndex = 0;
      session.votes = {};
      session.showVotes = false;
      return session;
    }
    return undefined;
  }

  addTask(sessionId: string, task: Task): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.tasks.push(task);
      return session;
    }
    return undefined;
  }

  editTask(sessionId: string, index: number, task: Task): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session && session.tasks[index]) {
      session.tasks[index] = { ...session.tasks[index], ...task };
      return session;
    }
    return undefined;
  }

  removeTask(sessionId: string, index: number): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.tasks.splice(index, 1);
      // Adjust currentTaskIndex if necessary
      if (session.currentTaskIndex >= session.tasks.length && session.tasks.length > 0) {
        session.currentTaskIndex = session.tasks.length - 1;
      } else if (session.tasks.length === 0) {
        session.currentTaskIndex = 0;
      }
      return session;
    }
    return undefined;
  }

  vote(sessionId: string, userId: string, value: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.votes[userId] = value;
      return session;
    }
    return undefined;
  }

  revealVotes(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.showVotes = true;
      return session;
    }
    return undefined;
  }

  resetVotes(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.votes = {};
      session.showVotes = false;
      return session;
    }
    return undefined;
  }

  setCurrentTask(sessionId: string, index: number, points?: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (points !== undefined) {
        session.tasks[session.currentTaskIndex].points = points;
      }
      session.currentTaskIndex = index;
      session.votes = {};
      session.showVotes = false;
      return session;
    }
    return undefined;
  }

  startCountdown(sessionId: string, durationMs: number = 3000): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Clear existing countdown if any
      const existingInterval = this.countdownIntervals.get(sessionId);
      if (existingInterval) clearInterval(existingInterval);

      let timeLeft = Math.ceil(durationMs / 1000);
      session.countdown = timeLeft;
      this.onSessionUpdated?.(session);

      const tickMs = durationMs < 1000 ? durationMs : 1000;
      const interval = setInterval(() => {
        if (durationMs < 1000) {
          timeLeft = 0;
        } else {
          timeLeft -= 1;
        }
        
        if (timeLeft <= 0) {
          clearInterval(interval);
          this.countdownIntervals.delete(sessionId);
          session.countdown = undefined;
          this.revealVotes(sessionId);
          this.onSessionUpdated?.(session);
        } else {
          session.countdown = timeLeft;
          this.onSessionUpdated?.(session);
        }
      }, tickMs);

      this.countdownIntervals.set(sessionId, interval);
      return session;
    }
    return undefined;
  }

  proposeAdminTransfer(sessionId: string, targetUserId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session && session.participants.find(p => p.id === targetUserId)) {
      session.pendingAdminId = targetUserId;
      return session;
    }
    return undefined;
  }

  acceptAdminTransfer(sessionId: string, userId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session && session.pendingAdminId === userId) {
      session.adminId = userId;
      session.pendingAdminId = undefined;
      return session;
    }
    return undefined;
  }

  transferAdmin(sessionId: string, userId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session && session.participants.find(p => p.id === userId)) {
      session.adminId = userId;
      session.pendingAdminId = undefined;
      return session;
    }
    return undefined;
  }
}

export const roomManager = new RoomManager();
