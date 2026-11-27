export type WorkspaceInfo = {
  name: string;
  shortName: string;
  datasetsCount: number;
  graphsCount: number;
  storageUsed: string;
  storageLimit: string;
};

export const MOCK_WORKSPACE: WorkspaceInfo = {
  name: "Laboratorio Cuantitativo Alpha",
  shortName: "Laboratorio Cuantitativo",
  datasetsCount: 6,
  graphsCount: 6,
  storageUsed: "0 B",
  storageLimit: "10 MB",
};

