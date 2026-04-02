import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-simple";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const ChangePasswordDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { changePassword, user } = useAuth();
  const { toast } = useToast();

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Por favor completá todos los campos", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(newPassword);

      // Clear needs_password_change flag in users table
      if (user?.id) {
        await supabase
          .from("users")
          .update({
            needs_password_change: false,
            password_hash: "$supabase$auth$handled",
          })
          .eq("id", user.id);
      }

      setIsOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Contraseña cambiada",
        description: "Tu contraseña fue actualizada exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al cambiar contraseña: " + (error?.message || "Error desconocido"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Lock className="h-4 w-4 mr-2" />
          Cambiar Mi Contraseña
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cambiar Mi Contraseña</DialogTitle>
          <DialogDescription>
            Por seguridad, cambia tu contraseña regularmente. Debe tener al
            menos 6 caracteres.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Importante:</strong> Una vez cambiada la contraseña,
              úsala en tu próximo login.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
