export interface Participant {
  id: string;
  name: string;
}

export interface Task {
  title: string;
  description: string;
  points?: string;
}

export interface Session {
  id: string;
  adminId: string;
  tasks: Task[];
  currentTaskIndex: number;
  participants: Participant[];
  votes: Record<string, string>; // userId -> value
  showVotes: boolean;
}
