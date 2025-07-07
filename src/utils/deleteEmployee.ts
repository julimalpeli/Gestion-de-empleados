import { supabase } from "@/lib/supabase";

interface DeleteEmployeeOptions {
  employeeId: string;
  confirm?: boolean;
  dryRun?: boolean;
}

interface DeletionReport {
  employeeData: any;
  vacationsDeleted: number;
  payrollsDeleted: number;
  documentsDeleted: number;
  userDeleted: boolean;
  employeeDeleted: boolean;
  errors: string[];
}

export const deleteEmployeeCompletely = async (
  options: DeleteEmployeeOptions,
): Promise<DeletionReport> => {
  const { employeeId, confirm = false, dryRun = false } = options;

  console.log(
    `🗑️  === COMPLETE EMPLOYEE DELETION ${dryRun ? "(DRY RUN)" : ""} ===`,
  );
  console.log(`Employee ID: ${employeeId}`);

  const report: DeletionReport = {
    employeeData: null,
    vacationsDeleted: 0,
    payrollsDeleted: 0,
    documentsDeleted: 0,
    userDeleted: false,
    employeeDeleted: false,
    errors: [],
  };

  try {
    // 1. Obtener datos del empleado
    console.log("\n📋 Step 1: Fetching employee data...");
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (employeeError || !employee) {
      throw new Error(`Employee not found: ${employeeError?.message}`);
    }

    report.employeeData = employee;
    console.log(`✅ Employee found: ${employee.name} (DNI: ${employee.dni})`);

    // Security confirmation
    if (!confirm && !dryRun) {
      const confirmMessage =
        `⚠️  CRITICAL DELETION CONFIRMATION ⚠️\n\n` +
        `You are about to DELETE COMPLETELY:\n` +
        `• Employee: ${employee.name}\n` +
        `• DNI: ${employee.dni}\n` +
        `• Email: ${employee.email}\n` +
        `• Position: ${employee.position}\n\n` +
        `This will DELETE ALL:\n` +
        `✗ Vacation requests\n` +
        `✗ Payroll records\n` +
        `✗ Documents\n` +
        `✗ User account\n` +
        `✗ Employee record\n\n` +
        `THIS ACTION CANNOT BE UNDONE!\n\n` +
        `Type "DELETE" to confirm:`;

      const userConfirmation = prompt(confirmMessage);
      if (userConfirmation !== "DELETE") {
        console.log("❌ Deletion cancelled by user");
        return report;
      }
    }

    // 2. Encontrar y eliminar vacaciones
    console.log("\n📅 Step 2: Deleting vacation requests...");

    const { data: vacations, error: vacationsQueryError } = await supabase
      .from("vacation_requests")
      .select("id")
      .eq("employee_id", employeeId);

    if (vacationsQueryError) {
      report.errors.push(
        `Error querying vacations: ${vacationsQueryError.message}`,
      );
    } else if (vacations) {
      console.log(`Found ${vacations.length} vacation requests`);

      if (!dryRun && vacations.length > 0) {
        const { error: deleteVacationsError } = await supabase
          .from("vacation_requests")
          .delete()
          .eq("employee_id", employeeId);

        if (deleteVacationsError) {
          report.errors.push(
            `Error deleting vacations: ${deleteVacationsError.message}`,
          );
        } else {
          report.vacationsDeleted = vacations.length;
          console.log(`✅ Deleted ${vacations.length} vacation requests`);
        }
      } else {
        report.vacationsDeleted = vacations.length;
        console.log(
          `${dryRun ? "(DRY RUN)" : ""} Would delete ${vacations.length} vacation requests`,
        );
      }
    }

    // 3. Encontrar y eliminar registros de nómina
    console.log("\n💰 Step 3: Deleting payroll records...");

    const { data: payrolls, error: payrollsQueryError } = await supabase
      .from("payroll_records")
      .select("id")
      .eq("employee_id", employeeId);

    if (payrollsQueryError) {
      report.errors.push(
        `Error querying payrolls: ${payrollsQueryError.message}`,
      );
    } else if (payrolls) {
      console.log(`Found ${payrolls.length} payroll records`);

      if (!dryRun && payrolls.length > 0) {
        const { error: deletePayrollsError } = await supabase
          .from("payroll_records")
          .delete()
          .eq("employee_id", employeeId);

        if (deletePayrollsError) {
          report.errors.push(
            `Error deleting payrolls: ${deletePayrollsError.message}`,
          );
        } else {
          report.payrollsDeleted = payrolls.length;
          console.log(`✅ Deleted ${payrolls.length} payroll records`);
        }
      } else {
        report.payrollsDeleted = payrolls.length;
        console.log(
          `${dryRun ? "(DRY RUN)" : ""} Would delete ${payrolls.length} payroll records`,
        );
      }
    }

    // 4. Encontrar y eliminar documentos
    console.log("\n📄 Step 4: Deleting documents...");

    const { data: documents, error: documentsQueryError } = await supabase
      .from("files")
      .select("id, file_path")
      .eq("employee_id", employeeId);

    if (documentsQueryError) {
      report.errors.push(
        `Error querying documents: ${documentsQueryError.message}`,
      );
    } else if (documents) {
      console.log(`Found ${documents.length} documents`);

      if (!dryRun && documents.length > 0) {
        // Delete from storage first
        const filePaths = documents.map((doc) => doc.file_path).filter(Boolean);
        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("employee-documents")
            .remove(filePaths);

          if (storageError) {
            console.warn(
              `⚠️  Storage deletion warning: ${storageError.message}`,
            );
          }
        }

        // Delete from database
        const { error: deleteDocumentsError } = await supabase
          .from("files")
          .delete()
          .eq("employee_id", employeeId);

        if (deleteDocumentsError) {
          report.errors.push(
            `Error deleting documents: ${deleteDocumentsError.message}`,
          );
        } else {
          report.documentsDeleted = documents.length;
          console.log(`✅ Deleted ${documents.length} documents`);
        }
      } else {
        report.documentsDeleted = documents.length;
        console.log(
          `${dryRun ? "(DRY RUN)" : ""} Would delete ${documents.length} documents`,
        );
      }
    }

    // 5. Encontrar y eliminar usuario asociado
    console.log("\n👤 Step 5: Deleting associated user...");

    const { data: users, error: usersQueryError } = await supabase
      .from("users")
      .select("id, username, email")
      .eq("employee_id", employeeId);

    if (usersQueryError) {
      report.errors.push(`Error querying users: ${usersQueryError.message}`);
    } else if (users && users.length > 0) {
      const user = users[0];
      console.log(`Found user: ${user.username} (${user.email})`);

      if (!dryRun) {
        // Delete from Supabase Auth first
        try {
          const { error: authDeleteError } =
            await supabase.auth.admin.deleteUser(user.id);
          if (authDeleteError) {
            console.warn(
              `⚠️  Auth deletion warning: ${authDeleteError.message}`,
            );
          }
        } catch (authError) {
          console.warn(`⚠️  Auth deletion warning: ${authError}`);
        }

        // Delete from users table
        const { error: deleteUserError } = await supabase
          .from("users")
          .delete()
          .eq("employee_id", employeeId);

        if (deleteUserError) {
          report.errors.push(`Error deleting user: ${deleteUserError.message}`);
        } else {
          report.userDeleted = true;
          console.log(`✅ Deleted user: ${user.username}`);
        }
      } else {
        report.userDeleted = true;
        console.log(
          `${dryRun ? "(DRY RUN)" : ""} Would delete user: ${user.username}`,
        );
      }
    } else {
      console.log("No associated user found");
    }

    // 6. Eliminar el empleado
    console.log("\n👨‍💼 Step 6: Deleting employee record...");

    if (!dryRun) {
      const { error: deleteEmployeeError } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeId);

      if (deleteEmployeeError) {
        report.errors.push(
          `Error deleting employee: ${deleteEmployeeError.message}`,
        );
      } else {
        report.employeeDeleted = true;
        console.log(`✅ Deleted employee: ${employee.name}`);
      }
    } else {
      report.employeeDeleted = true;
      console.log(
        `${dryRun ? "(DRY RUN)" : ""} Would delete employee: ${employee.name}`,
      );
    }

    // 7. Log security event
    console.log("\n🔐 Step 7: Logging security event...");
    const securityLog = {
      event: "EMPLOYEE_COMPLETE_DELETION",
      employeeId: employeeId,
      employeeName: employee.name,
      employeeDni: employee.dni,
      deletedData: {
        vacations: report.vacationsDeleted,
        payrolls: report.payrollsDeleted,
        documents: report.documentsDeleted,
        userDeleted: report.userDeleted,
        employeeDeleted: report.employeeDeleted,
      },
      errors: report.errors,
      timestamp: new Date().toISOString(),
      dryRun: dryRun,
    };

    console.log("🔐 Security Log:", securityLog);

    console.log(`\n✅ === DELETION ${dryRun ? "SIMULATION" : "COMPLETED"} ===`);
    console.log(`Employee: ${employee.name} (${employee.dni})`);
    console.log(`Vacations: ${report.vacationsDeleted}`);
    console.log(`Payrolls: ${report.payrollsDeleted}`);
    console.log(`Documents: ${report.documentsDeleted}`);
    console.log(`User deleted: ${report.userDeleted}`);
    console.log(`Employee deleted: ${report.employeeDeleted}`);
    console.log(`Errors: ${report.errors.length}`);

    if (report.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      report.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    return report;
  } catch (error) {
    console.error("❌ Fatal error during deletion:", error);
    report.errors.push(`Fatal error: ${error.message}`);
    return report;
  }
};

// Helper function to preview what would be deleted
export const previewEmployeeDeletion = async (employeeId: string) => {
  console.log("🔍 === EMPLOYEE DELETION PREVIEW ===");
  return await deleteEmployeeCompletely({
    employeeId,
    dryRun: true,
    confirm: true,
  });
};

// Helper function to delete employee with confirmation
export const deleteEmployeeWithConfirmation = async (employeeId: string) => {
  return await deleteEmployeeCompletely({
    employeeId,
    confirm: false,
    dryRun: false,
  });
};

// Helper function to force delete (bypass confirmation)
export const forceDeleteEmployee = async (employeeId: string) => {
  console.warn("⚠️  FORCE DELETE - BYPASSING CONFIRMATIONS");
  return await deleteEmployeeCompletely({
    employeeId,
    confirm: true,
    dryRun: false,
  });
};

// Make functions available globally for console use
if (typeof window !== "undefined") {
  (window as any).deleteEmployeeCompletely = deleteEmployeeCompletely;
  (window as any).previewEmployeeDeletion = previewEmployeeDeletion;
  (window as any).deleteEmployeeWithConfirmation =
    deleteEmployeeWithConfirmation;
  (window as any).forceDeleteEmployee = forceDeleteEmployee;

  console.log("🗑️  Employee deletion functions available:");
  console.log("   - previewEmployeeDeletion(employeeId) - Safe preview");
  console.log("   - deleteEmployeeWithConfirmation(employeeId) - With prompts");
  console.log("   - forceDeleteEmployee(employeeId) - Bypass confirmations");
  console.log("   - deleteEmployeeCompletely({ employeeId, confirm, dryRun })");
}
