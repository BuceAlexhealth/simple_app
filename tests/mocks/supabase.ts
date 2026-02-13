import { vi } from 'vitest';
import { mockAuthUsers, mockProfiles, mockOrders, mockInventoryItems } from './data';

export const createSupabaseMock = () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn(),
  };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: mockAuthUsers.patient } },
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockAuthUsers.patient },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {
          user: mockAuthUsers.patient,
          session: { access_token: 'mock-token', user: mockAuthUsers.patient },
        },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: {
          user: mockAuthUsers.patient,
          session: { access_token: 'mock-token', user: mockAuthUsers.patient },
        },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue(mockQueryBuilder),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
  };
};

export const mockSupabase = createSupabaseMock();

export const resetSupabaseMock = () => {
  Object.keys(mockSupabase.auth).forEach((key) => {
    const fn = (mockSupabase.auth as any)[key];
    if (typeof fn.mockReset === 'function') {
      fn.mockReset();
    }
  });
};

export const setupAuthMock = (role: 'patient' | 'pharmacist') => {
  const user = role === 'patient' ? mockAuthUsers.patient : mockAuthUsers.pharmacist;
  const profile = role === 'patient' ? mockProfiles.patient : mockProfiles.pharmacist;

  (mockSupabase.auth.getUser as any).mockResolvedValue({ data: { user } });
  (mockSupabase.auth.getSession as any).mockResolvedValue({ data: { session: { user } } });

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profile, error: null }),
  };

  (mockSupabase.from as any).mockImplementation(() => mockQueryBuilder);

  return { user, profile };
};

export const setupOrdersMock = (orders: any[] = mockOrders) => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: orders, error: null }),
  };

  (mockSupabase.from as any).mockImplementation(() => mockQueryBuilder);
  return mockQueryBuilder;
};

export const createOrderMockResponse = (order: any) => {
  return {
    data: [order],
    error: null,
  };
};

export const updateOrderMockResponse = (updatedOrder: any) => {
  return {
    data: [updatedOrder],
    error: null,
  };
};
