import { useState, useEffect } from "react";

// Employee interface
export interface Employee {
  id: number;
  name: string;
  position: string;
  sueldoBase: number;

  dailyWage: number;
  presentismo: number;
  losesPresentismo: boolean;
  presentismoComment: string;
  status: "active" | "inactive";
  startDate: string;
  vacationDays: number;
  vacationsTaken: number;
  phone?: string;
  email?: string;
  address?: string;
}

// Payroll interface
export interface PayrollRecord {
  id: number;
  employeeName: string;
  employeeId: number;
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
  netTotal: number;
  status: "draft" | "pending" | "processed";
  presentismoAmount: number;
  extraHours?: number;
  extraHoursAmount?: number;
  bonusAmount?: number;
  paidDate?: string;
  hasDocument?: boolean;
}

// Default employees data
const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: "Juan Pérez",
    position: "Cocinero",
    sueldoBase: 450000,

    dailyWage: 15000,
    presentismo: 25000,
    losesPresentismo: false,
    presentismoComment: "",
    status: "active",
    startDate: "2023-01-15",
    vacationDays: 14,
    vacationsTaken: 12,
    phone: "+54 11 1234-5678",
    email: "juan.perez@cadizbartapas.com",
    address: "Av. Corrientes 1234, CABA",
  },
  {
    id: 2,
    name: "María González",
    position: "Mesera",
    sueldoBase: 360000,

    dailyWage: 12000,
    presentismo: 20000,
    losesPresentismo: true,
    presentismoComment: "Ausencias sin justificar",
    status: "active",
    startDate: "2023-03-20",
    vacationDays: 14,
    vacationsTaken: 7,
    phone: "+54 11 2345-6789",
    email: "maria.gonzalez@cadizbartapas.com",
    address: "Av. Santa Fe 2345, CABA",
  },
  {
    id: 3,
    name: "Carlos López",
    position: "Cajero",
    sueldoBase: 405000,

    dailyWage: 13500,
    presentismo: 22000,
    losesPresentismo: false,
    presentismoComment: "",
    status: "active",
    startDate: "2018-11-10",
    vacationDays: 21,
    vacationsTaken: 0,
    phone: "+54 11 3456-7890",
    email: "carlos.lopez@cadizbartapas.com",
    address: "Av. Rivadavia 3456, CABA",
  },
  {
    id: 4,
    name: "Ana Martínez",
    position: "Ayudante de Cocina",
    sueldoBase: 330000,

    dailyWage: 11000,
    presentismo: 18000,
    losesPresentismo: false,
    presentismoComment: "",
    status: "inactive",
    startDate: "2023-06-01",
    vacationDays: 14,
    vacationsTaken: 0,
    phone: "+54 11 4567-8901",
    email: "ana.martinez@cadizbartapas.com",
    address: "Av. Callao 4567, CABA",
  },
  {
    id: 5,
    name: "Luis Fernández",
    position: "Encargado",
    sueldoBase: 750000,

    dailyWage: 25000,
    presentismo: 35000,
    losesPresentismo: false,
    presentismoComment: "",
    status: "active",
    startDate: "2025-05-22",
    vacationDays: 14,
    vacationsTaken: 0,
    phone: "+54 11 5678-9012",
    email: "luis.fernandez@cadizbartapas.com",
    address: "Av. Belgrano 5678, CABA",
  },
];

// Default payroll data
const DEFAULT_PAYROLL: PayrollRecord[] = [
  {
    id: 1,
    employeeName: "Juan Pérez",
    employeeId: 1,
    period: "Noviembre 2024",
    baseDays: 22,
    holidayDays: 2,
    baseAmount: 330000,
    holidayBonus: 60000,
    aguinaldo: 0,
    discounts: 50000,
    advances: 50000,
    whiteAmount: 220000,
    informalAmount: 120000,
    netTotal: 565000,
    status: "processed",
    presentismoAmount: 25000,
    paidDate: "30/11/2024",
    hasDocument: true,
  },
  {
    id: 2,
    employeeName: "María González",
    employeeId: 2,
    period: "Noviembre 2024",
    baseDays: 20,
    holidayDays: 1,
    baseAmount: 240000,
    holidayBonus: 12000,
    aguinaldo: 0,
    discounts: 0,
    advances: 30000,
    whiteAmount: 160000,
    informalAmount: 62000,
    netTotal: 402000,
    status: "pending",
    presentismoAmount: 0,
    paidDate: "30/11/2024",
    hasDocument: true,
  },
  {
    id: 3,
    employeeName: "Carlos López",
    employeeId: 3,
    period: "Octubre 2024",
    baseDays: 21,
    holidayDays: 0,
    baseAmount: 283500,
    holidayBonus: 0,
    aguinaldo: 0,
    discounts: 15000,
    advances: 0,
    whiteAmount: 199500,
    informalAmount: 69000,
    netTotal: 268500,
    status: "draft",
    presentismoAmount: 22000,
  },
];

const EMPLOYEES_STORAGE_KEY = "employees-data";
const PAYROLL_STORAGE_KEY = "payroll-data";

export const useEmployeesData = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const savedEmployees = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (savedEmployees) {
      try {
        setEmployees(JSON.parse(savedEmployees));
      } catch (error) {
        console.error("Error loading employees:", error);
        setEmployees(DEFAULT_EMPLOYEES);
        localStorage.setItem(
          EMPLOYEES_STORAGE_KEY,
          JSON.stringify(DEFAULT_EMPLOYEES),
        );
      }
    } else {
      setEmployees(DEFAULT_EMPLOYEES);
      localStorage.setItem(
        EMPLOYEES_STORAGE_KEY,
        JSON.stringify(DEFAULT_EMPLOYEES),
      );
    }
  }, []);

  const saveEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(newEmployees));
  };

  const addEmployee = (employee: Omit<Employee, "id">) => {
    const newId = Math.max(...employees.map((e) => e.id), 0) + 1;
    const newEmployee = { ...employee, id: newId };
    const newEmployees = [...employees, newEmployee];
    saveEmployees(newEmployees);
    return newEmployee;
  };

  const updateEmployee = (id: number, updates: Partial<Employee>) => {
    const newEmployees = employees.map((emp) =>
      emp.id === id ? { ...emp, ...updates } : emp,
    );
    saveEmployees(newEmployees);
  };

  const deleteEmployee = (id: number) => {
    const newEmployees = employees.filter((emp) => emp.id !== id);
    saveEmployees(newEmployees);
  };

  const getEmployeeById = (id: number) => {
    return employees.find((emp) => emp.id === id);
  };

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
  };
};

export const usePayrollData = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);

  useEffect(() => {
    const savedPayroll = localStorage.getItem(PAYROLL_STORAGE_KEY);
    if (savedPayroll) {
      try {
        setPayrollRecords(JSON.parse(savedPayroll));
      } catch (error) {
        console.error("Error loading payroll:", error);
        setPayrollRecords(DEFAULT_PAYROLL);
        localStorage.setItem(
          PAYROLL_STORAGE_KEY,
          JSON.stringify(DEFAULT_PAYROLL),
        );
      }
    } else {
      setPayrollRecords(DEFAULT_PAYROLL);
      localStorage.setItem(
        PAYROLL_STORAGE_KEY,
        JSON.stringify(DEFAULT_PAYROLL),
      );
    }
  }, []);

  const savePayrollRecords = (newRecords: PayrollRecord[]) => {
    setPayrollRecords(newRecords);
    localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(newRecords));
  };

  const addPayrollRecord = (record: Omit<PayrollRecord, "id">) => {
    const newId = Math.max(...payrollRecords.map((r) => r.id), 0) + 1;
    const newRecord = { ...record, id: newId };
    const newRecords = [...payrollRecords, newRecord];
    savePayrollRecords(newRecords);
    return newRecord;
  };

  const updatePayrollRecord = (id: number, updates: Partial<PayrollRecord>) => {
    const newRecords = payrollRecords.map((record) =>
      record.id === id ? { ...record, ...updates } : record,
    );
    savePayrollRecords(newRecords);
  };

  const deletePayrollRecord = (id: number) => {
    const newRecords = payrollRecords.filter((record) => record.id !== id);
    savePayrollRecords(newRecords);
  };

  return {
    payrollRecords,
    addPayrollRecord,
    updatePayrollRecord,
    deletePayrollRecord,
  };
};
