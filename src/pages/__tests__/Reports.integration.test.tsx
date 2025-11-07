import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, vi, beforeEach } from 'vitest';

// Mock hooks used by Reports
vi.mock('@/hooks/use-employees', () => ({
  useEmployees: () => ({
    employees: [
      {
        id: 'emp-1',
        name: 'Porras Daiana',
        sueldoBase: 375000,
        dailyWage: 12500,
        startDate: '2023-03-01',
        status: 'active',
      },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/use-payroll', () => ({
  usePayroll: () => ({
    payrollRecords: [
      {
        id: 'pay-1',
        employeeId: 'emp-1',
        employeeName: 'Porras Daiana',
        period: '2025-04',
        baseDays: 30,
        holidayDays: 0,
        baseAmount: 375000,
        holidayBonus: 0,
        aguinaldo: 0,
        discounts: 0,
        advances: 0,
        whiteAmount: 280000,
        informalAmount: 95000,
        presentismoAmount: 12000,
        overtimeAmount: 0,
        bonusAmount: 0,
        netTotal: 395000,
        status: 'processed',
      },
    ],
    loading: false,
    error: null,
  }),
}));

// Import component under test
import Reports from '../Reports';

describe('Reports integration (UI)', () => {
  beforeEach(() => {
    // Clear DOM between tests if needed
    document.body.innerHTML = '';
  });

  it('renders Reports header and table headers including Depósito and Efectivo', () => {
    render(<Reports />);

    expect(screen.getByText(/Reportes/i)).toBeInTheDocument();

    // The table headers should include Depósito and Efectivo
    expect(screen.getByText(/Depósito/i)).toBeInTheDocument();
    expect(screen.getByText(/Efectivo/i)).toBeInTheDocument();
  });
});
