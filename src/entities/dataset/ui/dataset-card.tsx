"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ROUTES } from "@/shared/config";
import { Badge, type BadgeVariant } from "@/shared/ui/badge";
import { Button, ButtonLink } from "@/shared/ui/button";
import {
  BarChartIcon,
  ClipboardIcon,
  FileEditIcon,
  ListIcon,
  TrashIcon,
  TrendChartIcon,
} from "@/shared/ui/icons";
import {
  getCustomParametersServerSnapshot,
  getCustomParametersSnapshot,
  mergeDatasetParameters,
  parseCustomParametersSnapshot,
  subscribeCustomParameters,
} from "../lib/custom-parameters-storage";
import { formatStorageBytes, getJsonByteSize } from "../lib/storage-quota";
import type { Dataset, DatasetKind } from "../model/types";

const kindBadgeVariant: Record<DatasetKind, BadgeVariant> = {
  individual: "accent",
  grouped: "accent",
  direct: "primary",
};

function DatasetKindIcon({ kind }: { kind: DatasetKind }) {
  if (kind === "grouped") return <BarChartIcon className="size-4.5" />;
  if (kind === "direct") return <ClipboardIcon className="size-4.5" />;
  return <ListIcon className="size-4.5" />;
}

export function DatasetCard({
  dataset,
  onDelete,
}: {
  dataset: Dataset;
  onDelete?: (datasetId: string) => void;
}) {
  const customRaw = useSyncExternalStore(
    subscribeCustomParameters,
    () => getCustomParametersSnapshot(dataset.id),
    getCustomParametersServerSnapshot,
  );

  const { liveVariablesCount, liveSizeLabel } = useMemo(() => {
    const customParams = parseCustomParametersSnapshot(customRaw);
    const effectiveDataset =
      customParams.length > 0
        ? {
            ...dataset,
            parameters: mergeDatasetParameters(dataset.parameters, customParams),
          }
        : dataset;

    const variablesCount =
      customParams.length > 0
        ? Math.max(dataset.variablesCount, effectiveDataset.parameters.length)
        : dataset.variablesCount;

    return {
      liveVariablesCount: variablesCount,
      liveSizeLabel: formatStorageBytes(getJsonByteSize(effectiveDataset)),
    };
  }, [customRaw, dataset]);

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/15 text-[#b5a7f8]">
            {dataset.id === "cohorte-manual-cali" ? (
              <FileEditIcon className="size-4.5" />
            ) : (
              <DatasetKindIcon kind={dataset.kind} />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {dataset.name}
            </h3>
            <p className="mt-0.5 text-xs leading-4 text-muted">
              {dataset.createdLabel}
            </p>
          </div>
        </div>

        <Badge
          variant={kindBadgeVariant[dataset.kind]}
          className="shrink-0 whitespace-nowrap text-[9px]"
        >
          {dataset.kindLabel}
        </Badge>
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-lg border border-border/80 bg-background/60 px-3 py-2.5 text-center">
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-wider text-muted">
            Muestra (N)
          </dt>
          <dd className="mt-1 font-mono text-xs font-semibold text-foreground">
            {dataset.sampleSize}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-wider text-muted">
            Variables
          </dt>
          <dd className="mt-1 font-mono text-xs font-semibold text-primary">
            {liveVariablesCount} {liveVariablesCount === 1 ? "variable" : "variables"}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-wider text-muted">
            Peso
          </dt>
          <dd className="mt-1 font-mono text-xs font-semibold text-foreground">
            {liveSizeLabel}
          </dd>
        </div>
      </dl>

      <div className="flex items-center gap-2">
        <ButtonLink
          href={ROUTES.datasetDetail(dataset.id)}
          size="sm"
          fullWidth
          className="h-9 text-xs font-semibold"
        >
          <TrendChartIcon className="size-3.5" />
          Ver Análisis &amp; Gráficos
        </ButtonLink>


        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(dataset.id)}
            aria-label={`Borrar ${dataset.name}`}
            title={`Borrar ${dataset.name}`}
            className="size-9 shrink-0 px-0 text-muted hover:border-danger/50 hover:bg-danger/10 hover:text-danger"
          >
            <TrashIcon className="size-3.5" />
          </Button>
        )}
      </div>
    </article>
  );
}

