import {
  analyzeQualitativeParameter,
  analyzeQuantitativeParameter,
  type DatasetParameter,
} from "@/entities/dataset";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { DownloadIcon, FileEditIcon, PlusIcon } from "@/shared/ui/icons";

type DatasetParametersTableProps = {
  datasetId: string;
  parameters: DatasetParameter[];
  selectedParameterId: string;
  onSelectParameter: (parameterId: string) => void;
};

export function DatasetParametersTable({
  datasetId,
  parameters,
  selectedParameterId,
  onSelectParameter,
}: DatasetParametersTableProps) {
  const quantCount = parameters.filter((p) => p.type === "quantitative").length;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Resumen Paramétrico de Variables Activas
          </h2>
          <p className="mt-1 text-xs text-muted">
            Matriz comparativa de medidas centrales y de dispersión del archivo
            cargado
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Filtro rápido:
          </span>
          <Badge variant="primary">
            {quantCount} de {parameters.length} columnas cuantitativas
          </Badge>
          <ButtonLink
            href={ROUTES.datasetNewParameter(datasetId)}
            size="sm"
            className="h-8 text-xs font-semibold"
          >
            <PlusIcon className="size-3.5" />
            Nuevo Parámetro
          </ButtonLink>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted">
              <th className="py-2.5 pr-4">Variable</th>
              <th className="py-2.5 px-3">Tipo</th>
              <th className="py-2.5 px-3">Muestra (N)</th>
              <th className="py-2.5 px-3">Media (μ)</th>
              <th className="py-2.5 px-3">Mediana</th>
              <th className="py-2.5 px-3">Moda</th>
              <th className="py-2.5 px-3">Desv. Est. (σ)</th>
              <th className="py-2.5 px-3">Varianza (σ²)</th>
              <th className="py-2.5 px-3">Rango [Mín, Máx]</th>
              <th className="py-2.5 pl-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {parameters.map((param) => {
              const active = param.id === selectedParameterId;
              const editHref = `${ROUTES.datasetNewParameter(datasetId)}?edit=${encodeURIComponent(param.id)}`;

              if (param.type === "quantitative") {
                const stats = analyzeQuantitativeParameter(param);
                return (
                  <tr
                    key={param.id}
                    className={cn(
                      "transition-colors",
                      active ? "bg-primary/5" : "hover:bg-surface-hover/50",
                    )}
                  >
                    <td className="py-3.5 pr-4 font-semibold">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            active ? "bg-primary" : "bg-border-strong",
                          )}
                          aria-hidden
                        />
                        <span className={active ? "text-primary" : "text-foreground"}>
                          {param.name}
                        </span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-muted">
                      {param.scale}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-foreground">
                      {stats.count.toLocaleString("en-US")}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-semibold text-primary">
                      {stats.mean.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-foreground">
                      {stats.median.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-foreground">
                      {stats.mode.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-semibold text-success">
                      {stats.stdDev.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-muted">
                      {stats.variance.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-muted">
                      [{stats.min.toFixed(1)}, {stats.max.toFixed(1)}]
                    </td>
                    <td className="py-3.5 pl-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant={active ? "primary" : "outline"}
                          size="sm"
                          onClick={() => onSelectParameter(param.id)}
                          className="h-7 px-2.5 text-[11px]"
                        >
                          {active ? "Activo" : "Analizar"}
                        </Button>
                        <ButtonLink
                          href={editHref}
                          variant="outline"
                          size="sm"
                          title={`Ver y editar datos de ${param.name}`}
                          className="h-7 px-2 text-[11px]"
                        >
                          <FileEditIcon className="size-3.5" />
                          Datos
                        </ButtonLink>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Descargar ${param.name}`}
                          className="size-7 px-0 text-muted"
                        >
                          <DownloadIcon className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              }

              const qualStats = analyzeQualitativeParameter(param);
              return (
                <tr
                  key={param.id}
                  className={cn(
                    "transition-colors",
                    active ? "bg-accent/10" : "hover:bg-surface-hover/50",
                  )}
                >
                  <td className="py-3.5 pr-4 font-semibold">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          active ? "bg-accent" : "bg-border-strong",
                        )}
                        aria-hidden
                      />
                      <span className={active ? "text-[#b5a7f8]" : "text-foreground"}>
                        {param.name}
                      </span>
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[#b5a7f8]">
                    {param.scale}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-foreground">
                    {qualStats.count.toLocaleString("en-US")}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-muted">—</td>
                  <td className="py-3.5 px-3 font-mono text-muted">—</td>
                  <td className="py-3.5 px-3 font-medium text-[#b5a7f8]">
                    {qualStats.mode}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-muted">—</td>
                  <td className="py-3.5 px-3 font-mono text-muted">—</td>
                  <td className="py-3.5 px-3 font-mono text-muted">
                    {qualStats.uniqueCount} niveles
                  </td>
                  <td className="py-3.5 pl-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant={active ? "primary" : "outline"}
                        size="sm"
                        onClick={() => onSelectParameter(param.id)}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        {active ? "Activo" : "Analizar"}
                      </Button>
                      <ButtonLink
                        href={editHref}
                        variant="outline"
                        size="sm"
                        title={`Ver y editar datos de ${param.name}`}
                        className="h-7 px-2 text-[11px]"
                      >
                        <FileEditIcon className="size-3.5" />
                        Datos
                      </ButtonLink>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Descargar ${param.name}`}
                        className="size-7 px-0 text-muted"
                      >
                        <DownloadIcon className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 border-t border-border/60 pt-3 font-mono text-[11px] text-muted">
        Fórmulas: μ = Σx/N · Me = P₅₀ · σ = √[Σ(x−μ)²/(N−1)] · Rango = MaxHeap(0)
        − MinHeap(0)
      </p>
    </Card>
  );
}
