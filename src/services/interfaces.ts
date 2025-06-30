// Interfaces de servicios - Estas NO cambian cuando migres a otro backend
export interface IEmployeeService {
  // CRUD Operations
  getAllEmployees(): Promise<Employee[]>;
  getEmployeeById(id: string): Promise<Employee | null>;
  createEmployee(employee: CreateEmployeeRequest): Promise<Employee>;
  updateEmployee(
    id: string,
    employee: UpdateEmployeeRequest,
  ): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  toggleEmployeeStatus(id: string): Promise<Employee>;

  // Business Logic
  getActiveEmployees(): Promise<Employee[]>;
  searchEmployees(query: string): Promise<Employee[]>;
  calculateVacationDays(startDate: string): VacationCalculation;
}

export interface IPayrollService {
  // CRUD Operations
  getAllPayrollRecords(): Promise<PayrollRecord[]>;
  getPayrollRecordById(id: string): Promise<PayrollRecord | null>;
  getPayrollRecordsByEmployee(employeeId: string): Promise<PayrollRecord[]>;
  createPayrollRecord(record: CreatePayrollRequest): Promise<PayrollRecord>;
  updatePayrollRecord(
    id: string,
    record: UpdatePayrollRequest,
  ): Promise<PayrollRecord>;
  deletePayrollRecord(id: string): Promise<void>;

  // Business Logic
  processPayrollRecord(id: string): Promise<PayrollRecord>;
  generatePayslip(id: string): Promise<PayslipData>;
  calculatePayroll(data: PayrollCalculationData): PayrollCalculation;
  getPayrollByPeriod(period: string): Promise<PayrollRecord[]>;
}

export interface IVacationService {
  // CRUD Operations
  getAllVacationRequests(): Promise<VacationRequest[]>;
  getVacationRequestById(id: string): Promise<VacationRequest | null>;
  getVacationRequestsByEmployee(employeeId: string): Promise<VacationRequest[]>;
  createVacationRequest(
    request: CreateVacationRequest,
  ): Promise<VacationRequest>;
  updateVacationRequest(
    id: string,
    request: UpdateVacationRequest,
  ): Promise<VacationRequest>;
  deleteVacationRequest(id: string): Promise<void>;

  // Business Logic
  approveVacationRequest(
    id: string,
    approvedBy: string,
  ): Promise<VacationRequest>;
  rejectVacationRequest(
    id: string,
    rejectedBy: string,
    reason?: string,
  ): Promise<VacationRequest>;
  getVacationBalance(employeeId: string): Promise<VacationBalance>;
}

export interface IAuthService {
  // Authentication
  login(username: string, password: string): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;

  // User Management
  createUser(user: CreateUserRequest): Promise<User>;
  updateUser(id: string, user: UpdateUserRequest): Promise<User>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
}

export interface IReportsService {
  // Reports Generation
  generateLiquidationsReport(
    filters: LiquidationReportFilters,
  ): Promise<LiquidationReportData>;
  generateAguinaldoReport(period: string): Promise<AguinaldoReportData>;
  generateVacationReport(
    filters: VacationReportFilters,
  ): Promise<VacationReportData>;
  generateCostReport(period: string): Promise<CostReportData>;
}

// Types y Request/Response interfaces
export interface Employee {
  id: string;
  name: string;
  dni: string;
  documentType?: string;
  position: string;
  whiteWage: number;
  informalWage: number;
  dailyWage: number;
  presentismo: number;
  losesPresentismo: boolean;
  status: "active" | "inactive";
  startDate: string;
  vacationDays: number;
  vacationsTaken: number;
  address?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  name: string;
  dni: string;
  documentType?: string;
  position: string;
  whiteWage: number;
  informalWage: number;
  presentismo: number;
  startDate: string;
  address?: string;
  email?: string;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  losesPresentismo?: boolean;
  status?: "active" | "inactive";
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  baseDays: number;
  holidayDays: number;
  baseAmount: number;
  holidayBonus: number;
  aguinaldo: number;
  discounts: number;
  advances: number;
  whiteAmount: number;
  informalAmount: number;
  presentismoAmount: number;
  overtimeHours?: number;
  overtimeAmount?: number;
  bonusAmount?: number;
  netTotal: number;
  status: "draft" | "pending" | "approved" | "processed" | "paid";
  processedDate?: string;
  processedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayrollRequest {
  employeeId: string;
  period: string;
  baseDays: number;
  holidayDays: number;
  baseAmount: number;
  holidayBonus: number;
  aguinaldo: number;
  discounts: number;
  advances: number;
  whiteAmount: number;
  informalAmount: number;
  presentismoAmount: number;
  overtimeHours?: number;
  overtimeAmount?: number;
  bonusAmount?: number;
  netTotal: number;
  status: "draft" | "pending" | "approved" | "processed" | "paid";
  processedDate?: string;
  processedBy?: string;
  notes?: string;
}

export interface UpdatePayrollRequest extends Partial<CreatePayrollRequest> {
  status?: "draft" | "pending" | "approved" | "processed" | "paid";
  processedDate?: string;
  processedBy?: string;
  notes?: string;
}

export interface VacationRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVacationRequest {
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateVacationRequest extends Partial<CreateVacationRequest> {
  status?: "pending" | "approved" | "rejected";
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "hr" | "employee" | "readonly";
  employeeId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "hr" | "employee" | "readonly";
  password: string;
  employeeId?: string;
}

export interface UpdateUserRequest
  extends Partial<Omit<CreateUserRequest, "password">> {
  isActive?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface VacationCalculation {
  years: number;
  vacationDays: number;
  totalMonths: number;
  eligibleForVacations: boolean;
  startDate: string;
}

export interface VacationBalance {
  totalDays: number;
  usedDays: number;
  availableDays: number;
  pendingDays: number;
}

export interface PayrollCalculation {
  basePay: number;
  holidayPay: number;
  overtimePay: number;
  presentismoAmount: number;
  bonusPay: number;
  grossTotal: number;
  totalAdvances: number;
  totalDiscounts: number;
  whiteAmount: number;
  informalAmount: number;
  netTotal: number;
}

export interface PayrollCalculationData {
  employeeId: string;
  workDays: number;
  holidayDays: number;
  presentismoStatus: "mantiene" | "pierde";
  advances: number;
  whiteWage: number;
  overtimeHours?: number;
  bonusAmount?: number;
}

export interface PayslipData {
  employee: Employee;
  payroll: PayrollRecord;
  period: string;
  generatedAt: string;
}

// Report interfaces
export interface LiquidationReportFilters {
  period?: string;
  employeeId?: string;
  status?: "all" | "with-aguinaldo" | "without-aguinaldo";
}

export interface LiquidationReportData {
  records: Array<{
    employeeName: string;
    period: string;
    efectivo: number;
    deposito: number;
    aguinaldo: number;
    totalNeto: number;
  }>;
  totals: {
    efectivo: number;
    deposito: number;
    aguinaldo: number;
    totalNeto: number;
  };
}

export interface AguinaldoReportData {
  period: string;
  employees: Array<{
    employee: Employee;
    calculation: {
      corresponds: boolean;
      amount: number;
      daysWorked: number;
      totalDays: number;
      proportional: boolean;
      reason: string;
    };
  }>;
  total: number;
}

export interface VacationReportFilters {
  year?: number;
  employeeId?: string;
  status?: "all" | "pending" | "approved" | "rejected";
}

export interface VacationReportData {
  requests: VacationRequest[];
  summary: {
    totalRequests: number;
    approvedDays: number;
    pendingDays: number;
    rejectedRequests: number;
  };
}

export interface CostReportData {
  period: string;
  totalCosts: number;
  breakdown: {
    salaries: number;
    presentismo: number;
    aguinaldos: number;
    overtime: number;
    bonuses: number;
  };
  employeeCount: number;
  averageCostPerEmployee: number;
}
