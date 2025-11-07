import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

import { useUsers } from "../use-users";

const { supabaseMock, authMock, fromMock } = vi.hoisted(() => {
  const authMock = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  };

  const fromMock = vi.fn();

  const supabaseMock = {
    from: fromMock,
    auth: authMock,
  };

  return { supabaseMock, authMock, fromMock };
});

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

type QueryResponse<T> = { data: T; error: any };

type ResponseFactory<T> = () => QueryResponse<T>;

type EqResponseFactory<T> = (
  column?: string,
  value?: string,
) => QueryResponse<T>;

const makeSelectOrderCall = <T,>(
  response: QueryResponse<T> | ResponseFactory<QueryResponse<T>>,
) => {
  const getResponse =
    typeof response === "function"
      ? (response as ResponseFactory<QueryResponse<T>>)
      : () => response;

  const orderMock = vi.fn(() => Promise.resolve(getResponse()));
  const selectMock = vi.fn(() => ({
    order: orderMock,
    eq: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve(getResponse())),
    })),
    single: vi.fn(() => Promise.resolve(getResponse())),
  }));

  return {
    builder: { select: selectMock },
    selectMock,
    orderMock,
  };
};

const makeInsertSelectSingleCall = <T,>(
  response: QueryResponse<T> | ResponseFactory<QueryResponse<T>>,
  onInsert?: (payload: any) => void,
) => {
  const getResponse =
    typeof response === "function"
      ? (response as ResponseFactory<QueryResponse<T>>)
      : () => response;

  const singleMock = vi.fn(() => Promise.resolve(getResponse()));
  const selectMock = vi.fn(() => ({ single: singleMock }));
  const insertMock = vi.fn((payload: any) => {
    onInsert?.(payload);
    return { select: selectMock };
  });

  return {
    builder: { insert: insertMock },
    insertMock,
    selectMock,
    singleMock,
  };
};

const makeUpdateEqCall = (
  resolveValue: any,
  onUpdate?: (info: { step: "update" | "eq"; payload?: any; column?: string; value?: string }) => void,
) => {
  const eqMock = vi.fn((column: string, value: string) => {
    onUpdate?.({ step: "eq", column, value });
    return Promise.resolve(resolveValue);
  });
  const updateMock = vi.fn((payload: any) => {
    onUpdate?.({ step: "update", payload });
    return { eq: eqMock };
  });

  return {
    builder: { update: updateMock },
    updateMock,
    eqMock,
  };
};

const makeSelectEqSingleCall = <T,>(
  response: QueryResponse<T> | EqResponseFactory<QueryResponse<T>>,
  onEq?: (info: { column?: string; value?: string }) => void,
) => {
  const getResponse =
    typeof response === "function"
      ? (response as EqResponseFactory<QueryResponse<T>>)
      : () => response;

  const eqMock = vi.fn((column: string, value: string) => {
    onEq?.({ column, value });
    const responseValue = getResponse(column, value);
    const single = vi.fn(() => Promise.resolve(responseValue));
    return { single };
  });

  const selectMock = vi.fn(() => ({
    eq: eqMock,
    single: () => Promise.resolve(getResponse()),
    order: vi.fn(),
  }));

  return {
    builder: { select: selectMock },
    selectMock,
    eqMock,
  };
};

describe("useUsers hook", () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  beforeEach(() => {
    fromMock.mockReset();
    authMock.signUp.mockReset();
    authMock.signInWithPassword.mockReset();
    authMock.signOut.mockReset();

    authMock.signInWithPassword.mockResolvedValue({ data: { user: null }, error: null });
    authMock.signOut.mockResolvedValue({});
  });

  it("fetches users and maps roles and active state correctly", async () => {
    const response = {
      data: [
        {
          id: "user-1",
          username: "admin1",
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
          employee_id: null,
          is_active: true,
          password_hash: "hash",
          last_login: "2025-01-01",
          needs_password_change: false,
          created_at: "2025-01-01",
          updated_at: "2025-01-02",
        },
        {
          id: "user-2",
          username: "worker1",
          email: "worker@example.com",
          name: "Worker User",
          role: "employee",
          employee_id: "emp-123",
          is_active: false,
          password_hash: "hash2",
          last_login: null,
          needs_password_change: true,
          created_at: "2025-02-01",
          updated_at: "2025-02-02",
        },
      ],
      error: null,
    } satisfies QueryResponse<any[]>;

    const selectCall = makeSelectOrderCall(response);
    fromMock.mockImplementation(() => selectCall.builder);

    const { result } = renderHook(() => useUsers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.users).toHaveLength(2);
    expect(result.current.users[0]).toMatchObject({
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      isActive: true,
    });
    expect(result.current.users[1]).toMatchObject({
      name: "Worker User",
      email: "worker@example.com",
      role: "employee",
      isActive: false,
      needsPasswordChange: true,
    });
  });

  it("creates a user via Supabase auth and inserts it into the users table before refreshing the cache", async () => {
    let usersData: any[] = [];

    const initialSelect = makeSelectOrderCall(() => ({
      data: usersData,
      error: null,
    }));

    const insertCall = makeInsertSelectSingleCall(
      () => ({ data: null, error: null }),
      (payload) => {
        usersData = [
          {
            ...payload,
            last_login: null,
          },
        ];
      },
    );

    const refetchSelect = makeSelectOrderCall(() => ({
      data: usersData,
      error: null,
    }));

    fromMock
      .mockImplementationOnce(() => initialSelect.builder)
      .mockImplementationOnce(() => insertCall.builder)
      .mockImplementationOnce(() => refetchSelect.builder);

    authMock.signUp.mockResolvedValueOnce({
      data: { user: { id: "auth-1", email: "new@user.com" } },
      error: null,
    });

    const { result } = renderHook(() => useUsers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createUser({
        username: "newuser",
        email: "new@user.com",
        name: "New User",
        role: "employee",
        password: "newpass",
      });
    });

    expect(authMock.signUp).toHaveBeenCalledWith({
      email: "new@user.com",
      password: "newpass",
      options: {
        emailRedirectTo: undefined,
        data: {
          name: "New User",
          role: "employee",
          username: "newuser",
        },
      },
    });

    expect(insertCall.insertMock).toHaveBeenCalledTimes(1);
    const insertedPayload = insertCall.insertMock.mock.calls[0][0];
    expect(insertedPayload).toMatchObject({
      username: "newuser",
      email: "new@user.com",
      role: "employee",
      is_active: true,
      needs_password_change: false,
    });
    expect(insertedPayload.password_hash).toBe(btoa("newpass"));

    await waitFor(() => expect(result.current.users).toHaveLength(1));
    expect(result.current.users[0]).toMatchObject({
      email: "new@user.com",
      role: "employee",
      isActive: true,
    });
  });

  it("updates user status and syncs the employee record when toggling isActive", async () => {
    const existingUsers = {
      data: [
        {
          id: "user-1",
          username: "worker1",
          email: "worker@example.com",
          name: "Worker User",
          role: "employee",
          employee_id: "emp-123",
          is_active: true,
          password_hash: "hash",
          last_login: null,
          needs_password_change: false,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ],
      error: null,
    } satisfies QueryResponse<any[]>;

    const initialSelect = makeSelectOrderCall(existingUsers);
    const usersUpdate = makeUpdateEqCall({ error: null });
    const employeeIdSelect = makeSelectEqSingleCall(() => ({
      data: { employee_id: "emp-123" },
      error: null,
    }));
    const employeeUpdate = makeUpdateEqCall({ error: null });
    const refetchSelect = makeSelectOrderCall(existingUsers);

    fromMock
      .mockImplementationOnce(() => initialSelect.builder)
      .mockImplementationOnce(() => usersUpdate.builder)
      .mockImplementationOnce(() => employeeIdSelect.builder)
      .mockImplementationOnce(() => employeeUpdate.builder)
      .mockImplementationOnce(() => refetchSelect.builder);

    const { result } = renderHook(() => useUsers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateUser("user-1", {
        name: "Worker User",
        isActive: false,
      });
    });

    expect(usersUpdate.updateMock).toHaveBeenCalledWith({
      name: "Worker User",
      is_active: false,
    });
    expect(usersUpdate.eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(employeeIdSelect.eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(employeeUpdate.updateMock).toHaveBeenCalledWith({
      status: "inactive",
      updated_at: expect.any(String),
    });
    expect(employeeUpdate.eqMock).toHaveBeenCalledWith("id", "emp-123");
    expect(refetchSelect.orderMock).toHaveBeenCalled();
  });

  it("resets the password directly and updates the needs_password_change flag", async () => {
    let usersData = [
      {
        id: "user-1",
        username: "worker1",
        email: "worker@example.com",
        name: "Worker User",
        role: "employee",
        employee_id: "emp-123",
        is_active: true,
        password_hash: "hash",
        last_login: null,
        needs_password_change: true,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
    ];

    const initialSelect = makeSelectOrderCall(() => ({
      data: usersData,
      error: null,
    }));

    const emailSelect = makeSelectEqSingleCall(() => ({
      data: {
        email: "worker@example.com",
        username: "worker1",
        name: "Worker User",
      },
      error: null,
    }));

    const usersUpdate = makeUpdateEqCall({ error: null }, (info) => {
      if (info.step === "update" && info.payload) {
        usersData = usersData.map((user) =>
          user.id === "user-1"
            ? {
                ...user,
                needs_password_change: info.payload.needs_password_change,
                updated_at: info.payload.updated_at,
              }
            : user,
        );
      }
    });

    const refetchSelect = makeSelectOrderCall(() => ({
      data: usersData,
      error: null,
    }));

    fromMock
      .mockImplementationOnce(() => initialSelect.builder)
      .mockImplementationOnce(() => emailSelect.builder)
      .mockImplementationOnce(() => usersUpdate.builder)
      .mockImplementationOnce(() => refetchSelect.builder);

    authMock.signUp.mockResolvedValue({ data: {}, error: null });

    const { result } = renderHook(() => useUsers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.resetPassword("user-1", "Secret123");
    });

    expect(authMock.signUp).toHaveBeenCalled();
    expect(usersUpdate.updateMock).toHaveBeenCalledWith({
      needs_password_change: false,
      updated_at: expect.any(String),
    });
    expect(usersUpdate.eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("worker@example.com"));

    await waitFor(() =>
      expect(result.current.users[0].needsPasswordChange).toBe(false),
    );
  });
});
