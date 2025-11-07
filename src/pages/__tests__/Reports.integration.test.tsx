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

// Mock sidebar provider & hook used by app chrome
vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: () => <div>SidebarTriggerStub</div>,
  SidebarProvider: ({ children }: any) => <div>{children}</div>,
  useSidebar: () => ({ isOpen: true, toggle: () => {} }),
}));

// Stub heavy child components to avoid executing their module-level code
vi.mock('@/components/LiquidationsReport', () => ({ default: () => <div>LiquidationsReportStub</div> }));
vi.mock('@/components/SimpleLiquidationsReport', () => ({ default: () => <div>SimpleLiquidationsReportStub</div> }));
vi.mock('@/components/MultipleReceiptsReport', () => ({ default: () => <div>MultipleReceiptsReportStub</div> }));

// Import component under test
import Reports from '../Reports';

describe('Reports integration (UI)', () => {
  beforeEach(() => {
    // Clear DOM between tests if needed
    document.body.innerHTML = '';
  });

  it('renders Reports header and table headers including Depósito and Efectivo', () => {
    let renderError: any = null;
    try {
      render(<Reports />);
    } catch (err) {
      renderError = err;
    }

    if (renderError) {
      // Fail the test with the render error details
      console.error('Render error:', renderError);
      throw renderError;
    }

    expect(screen.getByRole('heading', { name: /Reportes/i })).toBeInTheDocument();

    // Ensure the text appears somewhere in the rendered output
    const depositos = screen.getAllByText(/Depósito/i);
    const efectivos = screen.getAllByText(/Efectivo/i);
    expect(depositos.length).toBeGreaterThan(0);
    expect(efectivos.length).toBeGreaterThan(0);
  });
});
