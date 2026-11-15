import type { Dataset, DatasetParameter } from "@/entities/dataset";
import { ROUTES } from "@/shared/config";
import { Badge } from "@/shared/ui/badge";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  ArrowLeftIcon,
  DownloadIcon,
  FileEditIcon,
  PlusIcon,
  RefreshIcon,
} from "@/shared/ui/icons";

type DatasetHeaderProps = {
  dataset: Dataset;
  parameters: DatasetParameter[];
  selectedParameter: DatasetParameter;
  onSelectParameter: (parameterId: string) => void;
  onRecalculate: () => void;
};

export function DatasetHeader({
  dataset,
  parameters,
  selectedParameter,
  onSelectParameter,
  onRecalculate,
}: DatasetHeaderProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
        {/* Izquierda: volver + metadata del dataset */}
        <div className="min-w-0 flex-1">
          <ButtonLink
            href={ROUTES.main}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs text-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            Volver a Datasets
          </ButtonLink>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="success">
              Activo · N = {selectedParameter.values.length.toLocaleString("en-US")}{" "}
              registros
            </Badge>
            <Badge variant="neutral">
              {dataset.format} · {dataset.sizeLabel}
            </Badge>
          </div>

          <h1 className="mt-3 truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {dataset.fileName}
          </h1>

          <div className="mt-2 flex items-center gap-2">
            <Badge variant="primary" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              Descriptivo calculado
            </Badge>
          </div>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted sm:text-sm">
            {dataset.description}
          </p>
        </div>

        {/* Derecha: selector único de parámetro y acciones */}
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[360px]">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="parameter-select"
              className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted"
            >
              Variable analizada
            </label>
            <select
              id="parameter-select"
              value={selectedParameter.id}
              onChange={(e) => onSelectParameter(e.target.value)}
              className="h-10 w-full rounded-lg border border-border-strong bg-background/80 px-3 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {parameters.map((param, idx) => (
                <option key={param.id} value={param.id} className="bg-surface">
                  {param.name} (Var {idx + 1} –{" "}
                  {param.type === "quantitative"
                    ? `Cuantitativa ${param.scale}`
                    : `Cualitativa ${param.scale}`}
                  )
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRecalculate}
              className="h-9 text-xs"
            >
              <RefreshIcon className="size-3.5 text-primary" />
              Recalcular
            </Button>

            <ButtonLink
              href={`${ROUTES.datasetNewParameter(dataset.id)}?edit=${encodeURIComponent(selectedParameter.id)}`}
              variant="outline"
              size="sm"
              className="h-9 text-xs"
            >
              <FileEditIcon className="size-3.5 text-primary" />
              Editar / Ver Datos
            </ButtonLink>

            <Button variant="primary" size="sm" className="h-9 text-xs font-semibold">
              <DownloadIcon className="size-3.5" />
              Exportar Informe
            </Button>

            <ButtonLink
              href={ROUTES.datasetNewParameter(dataset.id)}
              variant="outline"
              size="sm"
              className="h-9 border-primary/40 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20"
            >
              <PlusIcon className="size-3.5" />
              Nuevo Parámetro
            </ButtonLink>
          </div>
        </div>
      </div>
    </Card>
  );
}
