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
  title: "Política de Tratamiento y Privacidad de Datos",
};

const CONTACT_EMAIL = "contacto@statprob.io";

export function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-12">
        <LegalDocument
          meta="Última actualización: Noviembre de 2026"
          title="Política de Tratamiento y Privacidad de Datos"
          intro={
            <p>
              En cumplimiento de la legislación aplicable en materia de protección de
              datos personales (incluyendo la Ley 1581 de 2012 y normas concordantes),
              el presente documento establece la forma en que StatProb recolecta,
              almacena, utiliza y protege la información suministrada por sus usuarios.
            </p>
          }
        >
          <LegalSection index="1." title="Datos personales y técnicos que recolectamos">
            <p>
              Para el funcionamiento de la plataforma, StatProb recopila exclusivamente
              dos categorías de información:
            </p>
            <LegalList>
              <LegalListItem>
                <strong>Datos de cuenta e identificación:</strong> dirección de correo
                electrónico y contraseña encriptada (mediante algoritmos de dispersión
                unidireccional o <em>hashing</em>), recolectados al momento de
                registrarse para autenticar tu acceso de forma segura.
              </LegalListItem>
              <LegalListItem>
                <strong>Datos de cálculo e información estadística:</strong> conjuntos de
                datos numéricos (<em>datasets</em>), listas de valores o tablas que
                ingreses manualmente o cargues mediante archivos (CSV, hojas de cálculo)
                con el propósito de calcular medidas de tendencia central, dispersión o
                generar gráficos. StatProb no solicita ni requiere nombres,
                identificaciones o datos confidenciales vinculados a dichos números.
              </LegalListItem>
            </LegalList>
          </LegalSection>

          <LegalSection index="2." title="Finalidad del tratamiento de los datos">
            <p>
              La información recolectada se utiliza estrictamente para las siguientes
              finalidades:
            </p>
            <LegalList>
              <LegalListItem>
                <strong>Gestión de cuentas y autenticación:</strong> permitir el inicio
                de sesión, la recuperación de acceso y la seguridad de tu perfil.
              </LegalListItem>
              <LegalListItem>
                <strong>Procesamiento y persistencia estadística:</strong> ejecutar las
                operaciones matemáticas solicitadas (media, mediana, moda, varianza,
                entre otras) y, en caso de que decidas guardar tus consultas, almacenar
                tus conjuntos de datos en tu panel personal para accesos futuros.
              </LegalListItem>
              <LegalListItem>
                <strong>Mantenimiento y soporte:</strong> atender solicitudes de
                asistencia técnica, errores en cálculos o peticiones sobre la
                plataforma.
              </LegalListItem>
            </LegalList>
            <LegalCallout>
              StatProb no vende, no comercializa ni transfiere tu correo electrónico ni
              tus datos numéricos a terceros con fines publicitarios o de perfilamiento
              comercial.
            </LegalCallout>
          </LegalSection>

          <LegalSection index="3." title="Tratamiento de los datos numéricos ingresados">
            <p>
              StatProb procesa los números y tablas suministrados únicamente como
              insumo para el motor de cálculo estadístico. Eres el único responsable del
              origen y la confidencialidad de la información numérica que decidas
              cargar en la plataforma. Te solicitamos no ingresar datos sensibles,
              información bancaria ni identificadores directos de personas en los campos
              destinados a variables estadísticas.
            </p>
          </LegalSection>

          <LegalSection index="4." title="Derechos del titular de los datos">
            <p>Como titular de tus datos personales, tienes derecho a:</p>
            <LegalList>
              <LegalListItem>
                <strong>Conocer y acceder:</strong> consultar qué información tenemos
                registrada en tu perfil en cualquier momento.
              </LegalListItem>
              <LegalListItem>
                <strong>Actualizar y rectificar:</strong> modificar o corregir tu correo
                electrónico si presenta algún error.
              </LegalListItem>
              <LegalListItem>
                <strong>Revocar y suprimir (derecho al olvido):</strong> solicitar la
                eliminación total y definitiva de tu cuenta de usuario, lo cual
                conllevará la purga inmediata de tu correo electrónico y de todos los
                conjuntos de datos estadísticos vinculados a tu identificador en la base
                de datos.
              </LegalListItem>
            </LegalList>
          </LegalSection>

          <LegalSection index="5." title="Mecanismo para el ejercicio de tus derechos">
            <p>
              Puedes ejercer tus derechos de actualización, consulta o eliminación
              definitiva directamente desde el panel de configuración de tu cuenta en
              StatProb o enviando una solicitud formal al correo de contacto del
              proyecto{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-mono text-primary hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              , indicando en el asunto «Solicitud de Protección de Datos - StatProb». Tu
              solicitud será procesada en un plazo máximo de 10 días hábiles.
            </p>
          </LegalSection>
        </LegalDocument>

        <GetStartedBanner />
      </main>
    </>
  );
}

