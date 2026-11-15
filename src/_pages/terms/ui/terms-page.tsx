import type { Metadata } from "next";
import {
  LegalCallout,
  LegalDocument,
  LegalList,
  LegalListItem,
  LegalSection,
} from "@/shared/ui/legal-document";
import { GetStartedBanner } from "@/widgets/get-started-banner";
import { SiteHeader } from "@/widgets/site-header";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Servicio",
};

export function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-12">
        <LegalDocument
          meta="Última actualización: Noviembre de 2026 · DOC. REF: ST-TRS-2026"
          title="Términos y Condiciones de Servicio"
          intro={
            <p>
              Al crear una cuenta, acceder o utilizar la herramienta web{" "}
              <strong>StatProb</strong>, aceptas quedar vinculado por los siguientes
              términos de servicio. Si no estás de acuerdo con alguna de estas
              condiciones, debes abstenerte de utilizar la plataforma.
            </p>
          }
        >
          <LegalSection index="01." title="Descripción del servicio">
            <p>
              StatProb es una aplicación web diseñada para el análisis, cálculo y
              visualización de conceptos estadísticos, incluyendo medidas de tendencia
              central, dispersión y distribuciones a partir de datos ingresados por el
              usuario. El servicio se ofrece en modalidad web, permitiendo el
              almacenamiento de consultas a usuarios registrados.
            </p>
          </LegalSection>

          <LegalSection index="02." title="Registro y seguridad de la cuenta">
            <LegalList>
              <LegalListItem>
                El usuario es responsable de mantener la confidencialidad de su
                contraseña y de cualquier actividad efectuada desde su sesión.
              </LegalListItem>
              <LegalListItem>
                Te comprometes a proporcionar una dirección de correo electrónico válida
                y propia durante el registro.
              </LegalListItem>
              <LegalListItem>
                StatProb se reserva el derecho de suspender cuentas que hagan uso
                abusivo de los servidores mediante scripts automatizados, intentos de
                inyección o peticiones masivas que comprometan la estabilidad del
                servicio.
              </LegalListItem>
            </LegalList>
          </LegalSection>

          <LegalSection index="03." title="Responsabilidad sobre el contenido ingresado">
            <LegalList>
              <LegalListItem>
                Conservas todos los derechos de propiedad intelectual sobre los
                conjuntos de datos que subas a la aplicación.
              </LegalListItem>
              <LegalListItem>
                Garantizas que los datos numéricos, hojas de cálculo o archivos cargados
                no infringen derechos de autor, secretos comerciales ni disposiciones de
                confidencialidad de terceros.
              </LegalListItem>
            </LegalList>
            <LegalCallout title="Limitación de responsabilidad matemática y legal">
              StatProb no se hace responsable por pérdidas de datos, decisiones
              académicas, operativas, financieras o empresariales tomadas con base en
              los resultados o aproximaciones matemáticas arrojados por la plataforma.
              El software se provee «tal cual» (as is), como herramienta de apoyo
              analítico y pedagógico.
            </LegalCallout>
          </LegalSection>

          <LegalSection index="04." title="Modificaciones y cancelación de cuenta">
            <LegalList>
              <LegalListItem>
                Puedes eliminar tu cuenta de usuario en cualquier momento a través de la
                interfaz de la plataforma o mediante los canales de soporte. Al
                confirmar la baja, el sistema revocará tu acceso y eliminará de forma
                irreversible tus registros y conjuntos de datos guardados.
              </LegalListItem>
              <LegalListItem>
                StatProb puede actualizar estos términos de servicio periódicamente. La
                continuidad en el uso del aplicativo tras la publicación de cambios
                implica la aceptación de los nuevos términos.
              </LegalListItem>
            </LegalList>
          </LegalSection>
        </LegalDocument>

        <GetStartedBanner />
      </main>
    </>
  );
}

