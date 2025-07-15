import { supabase } from "@/lib/supabase";

/**
 * Script para confirmar emails directamente en la base de datos
 * Útil durante desarrollo cuando no tienes proveedor de email configurado
 */

// Función para confirmar un email específico
export const confirmUserEmail = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`🔄 Confirmando email para: ${email}`);

    // Primero verificar si el usuario existe en auth.users
    const { data: authUser, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error accessing auth users:", authError);
      return {
        success: false,
        message: `Error accessing auth: ${authError.message}`,
      };
    }

    const user = authUser.users.find((u) => u.email === email);

    if (!user) {
      console.error("❌ Usuario no encontrado en auth.users");
      return { success: false, message: "Usuario no encontrado en auth.users" };
    }

    console.log("👤 Usuario encontrado:", user.email, "ID:", user.id);
    console.log(
      "📧 Email confirmado actualmente:",
      user.email_confirmed_at ? "SÍ" : "NO",
    );

    if (user.email_confirmed_at) {
      return { success: true, message: "Email ya estaba confirmado" };
    }

    // Confirmar email usando admin API
    const { data: updateResult, error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

    if (updateError) {
      console.error("❌ Error confirmando email:", updateError);
      return {
        success: false,
        message: `Error confirmando email: ${updateError.message}`,
      };
    }

    console.log("✅ Email confirmado exitosamente");
    console.log("📊 Resultado:", updateResult);

    return { success: true, message: "Email confirmado exitosamente" };
  } catch (error) {
    console.error("💥 Error inesperado:", error);
    return { success: false, message: `Error inesperado: ${error.message}` };
  }
};

// Función para confirmar todos los emails no confirmados
export const confirmAllUnconfirmedEmails = async (): Promise<{
  success: boolean;
  confirmed: number;
  errors: string[];
}> => {
  try {
    console.log("🔄 Confirmando todos los emails no confirmados...");

    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error accessing auth users:", authError);
      return { success: false, confirmed: 0, errors: [authError.message] };
    }

    const unconfirmedUsers = authUsers.users.filter(
      (user) => !user.email_confirmed_at,
    );

    console.log(
      `📊 Usuarios no confirmados encontrados: ${unconfirmedUsers.length}`,
    );

    if (unconfirmedUsers.length === 0) {
      return { success: true, confirmed: 0, errors: [] };
    }

    const errors: string[] = [];
    let confirmed = 0;

    for (const user of unconfirmedUsers) {
      try {
        console.log(`🔄 Confirmando: ${user.email}`);

        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            email_confirm: true,
          },
        );

        if (updateError) {
          console.error(
            `❌ Error confirmando ${user.email}:`,
            updateError.message,
          );
          errors.push(`${user.email}: ${updateError.message}`);
        } else {
          console.log(`✅ ${user.email} confirmado`);
          confirmed++;
        }
      } catch (error) {
        console.error(`💥 Error inesperado para ${user.email}:`, error);
        errors.push(`${user.email}: ${error.message}`);
      }
    }

    console.log(
      `🎉 Proceso completado: ${confirmed} emails confirmados, ${errors.length} errores`,
    );

    return { success: errors.length === 0, confirmed, errors };
  } catch (error) {
    console.error("💥 Error inesperado:", error);
    return { success: false, confirmed: 0, errors: [error.message] };
  }
};

// Función para listar todos los usuarios y su estado de confirmación
export const listUsersEmailStatus = async (): Promise<void> => {
  try {
    console.log("📋 Listando estado de confirmación de todos los usuarios...");

    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error accessing auth users:", authError);
      return;
    }

    console.log(`📊 Total de usuarios: ${authUsers.users.length}`);
    console.log("─".repeat(80));

    authUsers.users.forEach((user, index) => {
      const status = user.email_confirmed_at
        ? "✅ CONFIRMADO"
        : "❌ NO CONFIRMADO";
      const confirmedDate = user.email_confirmed_at
        ? new Date(user.email_confirmed_at).toLocaleString()
        : "N/A";

      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Estado: ${status}`);
      console.log(`   Confirmado: ${confirmedDate}`);
      console.log(`   Creado: ${new Date(user.created_at).toLocaleString()}`);
      console.log("─".repeat(80));
    });

    const confirmedCount = authUsers.users.filter(
      (u) => u.email_confirmed_at,
    ).length;
    const unconfirmedCount = authUsers.users.length - confirmedCount;

    console.log(`📈 Resumen:`);
    console.log(`   ✅ Confirmados: ${confirmedCount}`);
    console.log(`   ❌ No confirmados: ${unconfirmedCount}`);
  } catch (error) {
    console.error("💥 Error inesperado:", error);
  }
};

// Auto-exposición de funciones para uso en consola
if (typeof window !== "undefined") {
  (window as any).confirmUserEmail = confirmUserEmail;
  (window as any).confirmAllUnconfirmedEmails = confirmAllUnconfirmedEmails;
  (window as any).listUsersEmailStatus = listUsersEmailStatus;

  console.log("📧 EMAIL CONFIRMATION UTILITIES LOADED:");
  console.log(
    "   - confirmUserEmail('email@ejemplo.com') - Confirma un email específico",
  );
  console.log(
    "   - confirmAllUnconfirmedEmails() - Confirma todos los emails no confirmados",
  );
  console.log(
    "   - listUsersEmailStatus() - Lista el estado de todos los usuarios",
  );
}
