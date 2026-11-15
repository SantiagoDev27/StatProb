export type DatasetKind = "individual" | "grouped" | "direct";

export type DatasetFormat = "XLSX" | "CSV";

export type ParameterType = "quantitative" | "qualitative";

export type QuantitativeScale = "Float64" | "Int32";

export type QualitativeScale = "Nominal" | "Ordinal";

export type QuantitativeParameter = {
  id: string;
  name: string;
  type: "quantitative";
  scale: QuantitativeScale;
  unit?: string;
  values: number[];
};

export type QualitativeParameter = {
  id: string;
  name: string;
  type: "qualitative";
  scale: QualitativeScale;
  values: string[];
};

export type DatasetParameter = QuantitativeParameter | QualitativeParameter;

export type Dataset = {
  id: string;
  name: string;
  fileName: string;
  sidebarName: string;
  repositoryLabel: string;
  description: string;
  format: DatasetFormat;
  createdLabel: string;
  kindLabel: string;
  kind: DatasetKind;
  sampleSize: string;
  variablesCount: number;
  sizeLabel: string;
  hasSecondaryAction?: boolean;
  parameters: DatasetParameter[];
};
