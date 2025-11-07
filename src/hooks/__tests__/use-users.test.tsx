import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, vi, beforeEach } from 'vitest';

// Mock supabase module used by the hook
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: (table: string) => {
        return {
          select: (sel?: string) => ({
            order: (col: string, opts: any) => {
              if (table === 'users') {
                return Promise.resolve({
                  data: [
                    {
                      id: 'user-1',
                      username: 'admin1',
                      email: 'admin@example.com',
                      name: 'Admin User',
                      role: 'admin',
                      employee_id: null,
                      is_active: true,
                      password_hash: 'hash',
                      last_login: '2025-01-01',
                      needs_password_change: false,
                      created_at: '2025-01-01',
                      updated_at: '2025-01-02',
                    },
                    {
                      id: 'user-2',
                      username: 'worker1',
                      email: 'worker@example.com',
                      name: 'Worker User',
                      role: 'employee',
                      employee_id: 'emp-123',
                      is_active: false,
                      password_hash: 'hash2',
                      last_login: null,
                      needs_password_change: true,
                      created_at: '2025-02-01',
                      updated_at: '2025-02-02',
                    },
                  ],
                  error: null,
                });
              }

              return Promise.resolve({ data: [], error: null });
            },
          }),
        };
      },
    },
  };
});

import { useUsers } from '../use-users';

const TestComponent = () => {
  const { users, fetchUsers, loading } = useUsers();

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div>Loading</div>;

  return (
    <div>
      {users.map((u) => (
        <div key={u.id} data-testid={`user-${u.id}`}>
          <div>{u.name}</div>
          <div>{u.email}</div>
          <div>{u.role}</div>
          <div>{u.isActive ? 'active' : 'inactive'}</div>
        </div>
      ))}
    </div>
  );
};

describe('useUsers hook', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('fetches users and maps roles and active state correctly', async () => {
    render(<TestComponent />);

    // Wait for the two users to appear
    await waitFor(() => expect(screen.getByTestId('user-user-1')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('user-user-2')).toBeInTheDocument());

    // Assertions for admin user
    const adminNode = screen.getByTestId('user-user-1');
    expect(adminNode).toHaveTextContent('Admin User');
    expect(adminNode).toHaveTextContent('admin@example.com');
    expect(adminNode).toHaveTextContent('admin');
    expect(adminNode).toHaveTextContent('active');

    // Assertions for employee user
    const workerNode = screen.getByTestId('user-user-2');
    expect(workerNode).toHaveTextContent('Worker User');
    expect(workerNode).toHaveTextContent('worker@example.com');
    expect(workerNode).toHaveTextContent('employee');
    expect(workerNode).toHaveTextContent('inactive');
  });
});
