export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  main: "/main",
  profile: "/perfil",
  terms: "/terminos",
  privacy: "/privacidad",
  datasetCreate: "/datasets/nuevo",
  datasetDetail: (id: string) => `/datasets/${id}`,
  datasetNewParameter: (id: string) => `/datasets/${id}/nuevo-parametro`,
} as const;

