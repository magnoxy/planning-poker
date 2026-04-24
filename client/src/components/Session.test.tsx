import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Session } from './Session';
import type { Session as SessionType } from '../types';

describe('Session Component', () => {
  const mockSession: SessionType = {
    id: 'ROOM-1',
    adminId: 'admin-1',
    tasks: [{ title: 'Task 1', description: 'Desc 1' }],
    currentTaskIndex: 0,
    participants: [{ id: 'admin-1', name: 'Admin' }, { id: 'user-2', name: 'User 2' }],
    votes: {
      'admin-1': '2',
      'user-2': '13'
    },
    showVotes: true
  };

  const defaultProps = {
    session: mockSession,
    userId: 'admin-1',
    onVote: vi.fn(),
    onReveal: vi.fn(),
    onReset: vi.fn(),
    onImport: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onAddTask: vi.fn(),
    onEditTask: vi.fn(),
    onRemoveTask: vi.fn(),
  };

  it('should calculate consensus as nearest Fibonacci value to the average', () => {
    render(<Session {...defaultProps} />);
    // Average of 2 and 13 is 7.5, nearest Fibonacci is 8
    expect(screen.getByText(/Consensus: 8/)).toBeInTheDocument();
  });

  it('should exclude non-numeric votes and round to nearest Fibonacci', () => {
    const sessionWithMixedVotes: SessionType = {
      ...mockSession,
      votes: {
        'admin-1': '3',
        'user-2': '5',
        'user-3': '?'
      }
    };
    render(<Session {...defaultProps} session={sessionWithMixedVotes} />);
    // Average of 3 and 5 is 4, nearest Fibonacci values are 3 and 5.
    // 4 is equidistant from 3 and 5. Math.abs(3-4) = 1, Math.abs(5-4) = 1.
    // reduce logic will return the first one (3) if using <. 
    // If the average is 4, it should be 3 or 5.
    expect(screen.getByText(/Consensus: (3|5)/)).toBeInTheDocument();
  });
});
