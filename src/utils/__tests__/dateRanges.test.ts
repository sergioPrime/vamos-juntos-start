import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateDateRange, PERIOD_OPTIONS } from '../dateRanges';
import { format } from 'date-fns';

describe('dateRanges', () => {
  const mockDate = new Date('2024-03-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate today range', () => {
    const result = calculateDateRange('today');
    expect(result).not.toBeNull();
    expect(result?.startDate).toBeDefined();
    expect(result?.endDate).toBeDefined();
  });

  it('should calculate this month range', () => {
    const result = calculateDateRange('this_month');
    expect(result?.startDate.getDate()).toBe(1);
  });

  it('should return null for invalid period', () => {
    const result = calculateDateRange('invalid');
    expect(result).toBeNull();
  });

  it('should have all period options defined', () => {
    expect(PERIOD_OPTIONS.length).toBeGreaterThan(0);
  });
});
