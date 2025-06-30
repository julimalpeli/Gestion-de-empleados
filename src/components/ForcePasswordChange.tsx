import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ForcePasswordChangeProps {
  isOpen: boolean;
  username: string;
  onPasswordChanged: () => void;
}

const ForcePasswordChange = ({
  isOpen,
  username,
  onPasswordChanged,
}: ForcePasswordChangeProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validaciones
    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    if (newPassword === currentPassword) {
      setError("La nueva contraseña debe ser diferente a la actual");
      setIsLoading(false);
      return;
    }

    try {
      // Verificar contraseña actual
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("id, password_hash")
        .eq("username", username)
        .single();

      if (fetchError || !user) {
        setError("Error al verificar usuario");
        setIsLoading(false);
        return;
      }

      // Verificar contraseña actual (simple base64 para demo)
      const storedPassword = atob(user.password_hash);
      if (storedPassword !== currentPassword) {
        setError("La contraseña actual es incorrecta");
        setIsLoading(false);
        return;
      }

      // Actualizar contraseña
      const newPasswordHash = btoa(newPassword);
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password_hash: newPasswordHash,
          needs_password_change: false,
        })
        .eq("id", user.id);

      if (updateError) {
        setError("Error al actualizar contraseña");
        setIsLoading(false);
        return;
      }

      // Éxito
      onPasswordChanged();
    } catch (error) {
      console.error("Error changing password:", error);
      setError("Error inesperado al cambiar contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            Cambio de Contraseña Obligatorio
          </DialogTitle>
          <DialogDescription>
            Debes cambiar tu contraseña antes de continuar. Esta es tu primera
            vez ingresando al sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-orange-800">
              Por seguridad, debes establecer una nueva contraseña personal.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Contraseña Actual (tu DNI)</Label>
            <Input
              id="current"
              type="password"
              placeholder="Ingresa tu DNI"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new">Nueva Contraseña</Label>
            <Input
              id="new"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar Nueva Contraseña</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Repite la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Cambiando contraseña..." : "Cambiar Contraseña"}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              Usuario: <strong>{username}</strong>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForcePasswordChange;
