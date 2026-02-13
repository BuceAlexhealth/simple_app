import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestWrapper } from '../setup';
import { useAuth } from '@/hooks/useAuth';
import { mockSupabase } from '../../mocks/supabase';
import { mockProfiles } from '../../mocks/data';

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides correct profile data for patient', async () => {
    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfiles.patient, error: null }),
    };

    (mockSupabase.from as any).mockImplementation(() => mockQueryBuilder);
    (mockSupabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'patient-uuid-123', email: 'john@example.com' } }
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile?.full_name).toBe('John Patient');
    expect(result.current.profile?.role).toBe('patient');
  });

  it('provides correct profile data for pharmacist', async () => {
    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfiles.pharmacist, error: null }),
    };

    (mockSupabase.from as any).mockImplementation(() => mockQueryBuilder);
    (mockSupabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'pharmacist-uuid-456', email: 'jane@pharmacy.com' } }
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile?.full_name).toBe('Dr. Jane Pharmacist');
    expect(result.current.profile?.role).toBe('pharmacist');
  });

  it('has loading state initially', () => {
    (mockSupabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'patient-uuid-123' } }
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper,
    });

    expect(result.current.loading).toBe(true);
  });

  it('returns null profile when user is not authenticated', async () => {
    (mockSupabase.auth.getUser as any).mockResolvedValue({
      data: { user: null }
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });
});
