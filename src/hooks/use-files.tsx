import { useState, useEffect } from "react";

export interface FileDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: string;
  description?: string;
  category: "payroll" | "personal" | "contract" | "other";
  entityType: "employee" | "payroll";
  entityId: number;
  uploadedBy?: string;
}

// Mock file storage - in real app this would be an API
const STORAGE_KEY = "app-files";

const useFiles = () => {
  const [files, setFiles] = useState<FileDocument[]>([]);

  useEffect(() => {
    // Load files from localStorage on mount
    const savedFiles = localStorage.getItem(STORAGE_KEY);
    if (savedFiles) {
      try {
        setFiles(JSON.parse(savedFiles));
      } catch (error) {
        console.error("Error loading files:", error);
      }
    }
  }, []);

  const saveFiles = (newFiles: FileDocument[]) => {
    setFiles(newFiles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFiles));
  };

  const addFile = (file: FileDocument) => {
    const newFiles = [...files, file];
    saveFiles(newFiles);
  };

  const removeFile = (fileId: string) => {
    const newFiles = files.filter((f) => f.id !== fileId);
    saveFiles(newFiles);
  };

  const getFilesByEntity = (entityType: string, entityId: number) => {
    return files.filter(
      (f) => f.entityType === entityType && f.entityId === entityId,
    );
  };

  const getFilesByEmployee = (employeeId: number) => {
    return files.filter(
      (f) =>
        f.entityId === employeeId ||
        (f.entityType === "payroll" &&
          getEmployeeIdFromPayroll(f.entityId) === employeeId),
    );
  };

  // Helper function to get employee ID from payroll record
  // In real app, this would be a proper lookup
  const getEmployeeIdFromPayroll = (payrollId: number) => {
    // Mock mapping - in real app this would come from the payroll record
    const payrollToEmployee: { [key: number]: number } = {
      1: 1, // Juan Pérez
      2: 2, // María González
      3: 3, // Carlos López
    };
    return payrollToEmployee[payrollId] || 1;
  };

  const updateFile = (fileId: string, updates: Partial<FileDocument>) => {
    const newFiles = files.map((f) =>
      f.id === fileId ? { ...f, ...updates } : f,
    );
    saveFiles(newFiles);
  };

  return {
    files,
    addFile,
    removeFile,
    getFilesByEntity,
    getFilesByEmployee,
    updateFile,
  };
};

export default useFiles;
