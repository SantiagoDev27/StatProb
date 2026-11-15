import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/icons";

/** Botón de acceso con Google. TODO: conectar con el proveedor OAuth. */
export function GoogleSignInButton() {
  return (
    <Button variant="outline" title="Próximamente" className="self-start px-6">
      <GoogleIcon />
      Google
    </Button>
  );
}

