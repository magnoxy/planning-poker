import { Session, Task, Participant } from './types';

class RoomManager {
  private sessions: Map<string, Session> = new Map();

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
}

export const roomManager = new RoomManager();
