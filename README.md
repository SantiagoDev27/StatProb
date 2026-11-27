# StatProb — Plataforma de Modelado Estadístico y Análisis Probabilístico

**StatProb** es una aplicación web interactiva diseñada para la gestión de conjuntos de datos (*datasets*), captura manual de variables cuantitativas y cualitativas, cálculo de estadística descriptiva en tiempo real, visualización gráfica (histogramas, diagramas de caja y bigotes, gráficos de barras y anillos proporcionales) y exploración topológica mediante grafos bipartitos.

El proyecto está construido con **Next.js 16 (App Router + Turbopack)**, **React 19**, **TypeScript**, **Tailwind CSS 4** y **Firebase (Authentication + Realtime Database)**, organizado estrictamente bajo la arquitectura **Feature-Sliced Design (FSD)**.

## Enlaces del Proyecto

- **Aplicación en Producción:** [Gestión de Datasets · StatProb](https://stat-prob.vercel.app/main)
- **Diseño UI/UX en Figma:** [StatProb Early Version (Figma)](https://www.figma.com/design/FFmjsERzMacqxNBqg61YuY/StatProb-Early-version?node-id=0-1&t=KyZPOuf2oqBByEoK-1)

---

## Funcionalidades Principales

1. **Autenticación y Perfil en Tiempo Real**
   - Inicio de sesión y registro con **correo electrónico y contraseña** o **Google OAuth** mediante Firebase Authentication (`/login`, `/register`).
   - **Recuperación de contraseña** con `sendPasswordResetEmail` desde `/login`.
   - **Modo de prueba local**: ingresando `local` en usuario y contraseña se accede al entorno demostrativo sin requerir cuenta de Firebase (con 6 datasets de ejemplo).
   - **Personalización de perfil (`/perfil`)**: edición del nombre del usuario y carga de foto de perfil (con recorte `1:1`, compresión a `WEBP/JPEG` y soporte para **arrastrar y soltar**), sincronizados en vivo mediante Firebase Realtime Database (`users/{uid}`).
   - Páginas legales conectadas: **Términos de Servicio** (`/terminos`) y **Privacidad de Datos** (`/privacidad`).

2. **Gestión de Datasets (`/main`, `/datasets/nuevo`)**
   - **Usuarios autenticados con Firebase**: ven y administran exclusivamente los datasets creados por su cuenta, sincronizados en tiempo real en `users/{uid}/datasets/{datasetId}` (cada creación, edición de parámetros o eliminación actualiza la base de datos al instante).
   - **Usuario de prueba (`local/local`)**: trabaja con los 6 datasets de ejemplo y persistencia temporal en `sessionStorage`.
   - Filtrado rápido por pestañas (**Todos**, **Datos Individuales**, **Datos Agrupados**, **Recientes**), búsqueda global en vivo y eliminación directa desde cada tarjeta.
   - Al cerrar sesión se ejecuta limpieza completa de estado local, caché del navegador y pilas de historial antes de regresar a `/login`.

3. **Diagnóstico Estadístico y Editor de Parámetros (`/datasets/[id]`, `/datasets/[id]/nuevo-parametro`)**
   - **Variables Cuantitativas**:
     - Cálculo de tamaño muestral ($N$), media aritmética ($\mu$) con intervalo de confianza al 95 %, mediana ($Me / Q_2$), moda ($Mo$), desviación estándar ($\sigma$), varianza ($\sigma^2$), coeficiente de variación ($CV$), asimetría y curtosis.
     - **Histograma interactivo SVG** con curva de densidad normal superpuesta y selección entre **3 presets de intervalos** (`10`, `20`, `30` intervalos).
     - **Diagrama de Caja y Bigotes (Boxplot)** con cuartiles Tukey ($Q_1, Q_2, Q_3$), rango intercuartílico ($RIC / IQR$), bigotes y detección de valores atípicos.
   - **Variables Cualitativas**:
     - Cálculo de tamaño muestral ($N$), moda / categoría dominante, categorías únicas ($K$), índice de diversidad / entropía de Shannon ($H$), tabla de frecuencias acumuladas (Pareto) y gráfico de anillo proporcional.
     - **Plantillas rápidas** (`LIKERT 5 PTS`, `BINARIO SÍ/NO`, `ALTO/MEDIO/BAJO`) y creación de niveles o plantillas personalizadas al momento.
   - Edición de parámetros existentes y visualización de sus observaciones individuales desde `/datasets/[id]?edit=...`.

4. **Mapa Topológico de Relaciones — Grafos (`/grafos`)**
   - Visualización interactiva SVG con dos tipos de nodos:
     - **Nodos Principales (Datasets)** representados como hexágonos.
     - **Nodos Secundarios (Parámetros)** representados como círculos (cuantitativos) o cuadrados redondeados (cualitativos); aquellos presentes en $\ge 2$ datasets actúan como **nodos puente** que los comunican.
   - Soporta arrastre libre de nodos, desplazamiento (*pan*), zoom (`+`, `−`, ajuste al `100%`), minimapa, resaltado de vecindad en el grafo e inspección directa hacia el diagnóstico del parámetro/dataset.

---

## Estructuras de Datos Utilizadas

Todas las estructuras de datos están implementadas desde cero en TypeScript dentro de [`src/shared/lib/data-structures/`](src/shared/lib/index.ts):

| Estructura de Datos | Archivo de Implementación | Propósito y Complejidad | Dónde se Usa en el Código |
| :--- | :--- | :--- | :--- |
| **Min-Heap y Max-Heap** (`BinaryHeap`, `MinHeap`, `MaxHeap`, `MinMaxHeapPair`) | [`src/shared/lib/data-structures/binary-heap.ts`](src/shared/lib/data-structures/binary-heap.ts) | Obtener el **mínimo** y **máximo** en tiempo constante $\mathcal{O}(1)$ (`peek()`), construcción en $\mathcal{O}(n)$ y cálculo del rango para construir los intervalos del histograma. | • [`src/entities/dataset/lib/statistics.ts`](src/entities/dataset/lib/statistics.ts) (`analyzeQuantitativeParameter`)<br>• [`src/widgets/dataset-diagnostics/ui/`](src/widgets/dataset-diagnostics/index.ts) (Histograma, Boxplot y tabla comparativa)<br>• [`src/features/create-parameter/ui/quantitative-matrix-editor.tsx`](src/features/create-parameter/ui/quantitative-matrix-editor.tsx) |
| **Árbol de Prefijos — Trie** (`Trie`, `TrieNode`, `normalizeTrieText`, `tokenizeForTrie`) | [`src/shared/lib/data-structures/trie.ts`](src/shared/lib/data-structures/trie.ts) | Búsqueda y autocompletado instantáneo de datasets por prefijo en $\mathcal{O}(M + K)$ (independiente del total de datasets $N$), insensible a mayúsculas y tildes, y con soporte multi-término. | • [`src/features/search-datasets/model/dataset-search-trie.ts`](src/features/search-datasets/model/dataset-search-trie.ts)<br>• [`src/features/search-datasets/ui/dataset-search-bar.tsx`](src/features/search-datasets/ui/dataset-search-bar.tsx)<br>• [`src/widgets/workspace-layout/ui/workspace-topbar.tsx`](src/widgets/workspace-layout/ui/workspace-topbar.tsx)<br>• [`src/widgets/datasets-overview/ui/datasets-grid.tsx`](src/widgets/datasets-overview/ui/datasets-grid.tsx) |
| **Lista Doblemente Enlazada** (`DoublyLinkedList`, `DoublyLinkedNode`) | [`src/shared/lib/data-structures/doubly-linked-list.ts`](src/shared/lib/data-structures/doubly-linked-list.ts) | Almacenar dinámicamente la colección de datasets con enlaces `prev` y `next`, insertar recientes en cabeza (`prepend`) en $\mathcal{O}(1)$, recorrer en orden y eliminar nodos (`removeNode`) puenteando referencias en $\mathcal{O}(1)$. | • [`src/entities/dataset/lib/custom-parameters-storage.ts`](src/entities/dataset/lib/custom-parameters-storage.ts) (`buildDatasetsLinkedList`, `saveCustomDataset`, `deleteDatasetById`, `useDatasetsLinkedList`)<br>• [`src/widgets/datasets-overview/ui/datasets-grid.tsx`](src/widgets/datasets-overview/ui/datasets-grid.tsx)<br>• [`src/entities/dataset/ui/dataset-card.tsx`](src/entities/dataset/ui/dataset-card.tsx) |
| **Pilas — Stacks (LIFO)** (`Stack`, `UndoRedoHistory`) | [`src/shared/lib/data-structures/stack.ts`](src/shared/lib/data-structures/stack.ts) | Sistema **Deshacer / Rehacer (`Ctrl + Z` / `Ctrl + Y`)** mediante dos pilas (`undoStack` y `redoStack`) con operaciones `push`, `pop` y `peek` en $\mathcal{O}(1)$. | • [`src/features/create-parameter/ui/parameter-creator-form.tsx`](src/features/create-parameter/ui/parameter-creator-form.tsx) (historial del editor de matrices y parámetros)<br>• [`src/entities/dataset/lib/custom-parameters-storage.ts`](src/entities/dataset/lib/custom-parameters-storage.ts) y [`src/widgets/datasets-overview/ui/datasets-grid.tsx`](src/widgets/datasets-overview/ui/datasets-grid.tsx) (revertir eliminación o cambio de datasets) |
| **Grafo No Dirigido con Listas de Adyacencia** (`Graph`) | [`src/shared/lib/data-structures/graph.ts`](src/shared/lib/data-structures/graph.ts) | Modelar la red bipartita entre **Datasets** y **Parámetros** usando mapas de adyacencia en $\mathcal{O}(|V| + |E|)$, consultar grados (`getDegree`) y vecindad (`getNeighbors`) y ejecutar recorrido en anchura (`bfs`). | • [`src/widgets/dataset-graph/model/build-dataset-graph.ts`](src/widgets/dataset-graph/model/build-dataset-graph.ts)<br>• [`src/widgets/dataset-graph/ui/dataset-graph-view.tsx`](src/widgets/dataset-graph/ui/dataset-graph-view.tsx)<br>• [`src/_pages/graphs/ui/graphs-page.tsx`](src/_pages/graphs/ui/graphs-page.tsx) |

---

## Arquitectura del Proyecto (Feature-Sliced Design)

El código fuente sigue estrictamente la jerarquía de capas de **Feature-Sliced Design (FSD)** con importaciones unidireccionales y API pública (`index.ts`) por cada slice:

```text
app/                        # Enrutamiento del App Router de Next.js (wrappers mínimos)
src/
├── _pages/                 # Composición de páginas completas (login, register, main, dataset-detail, graphs, profile, ...)
├── widgets/                # Bloques compuestos de UI (workspace-layout, datasets-overview, dataset-diagnostics, dataset-graph, profile-settings, ...)
├── features/               # Acciones e interacciones de usuario (login-by-email, register-by-email, auth-by-google, create-parameter, search-datasets, profile-menu, upload-avatar)
├── entities/               # Modelos y lógica de dominio (dataset, user, workspace)
└── shared/                 # Utilidades, estructuras de datos, Firebase SDK, configuración, iconos y UI base
```

---

## Stack Tecnológico

* **Framework**: Next.js `16.4.6` (App Router, Cache Components, Turbopack)
* **Biblioteca UI**: React `19.3.0` y React DOM `19.3.0`
* **Lenguaje**: TypeScript `^5` (`strict: true`)
* **Estilos**: Tailwind CSS `4.3.3` + `@tailwindcss/turbopack` + fuente `Inter` y `Geist Mono` (`next/font/google`)
* **Backend / BaaS**: Firebase `^13.4.0` (Firebase Authentication + Firebase Realtime Database)
* **Calidad de código**: ESLint `^9` (`eslint-config-next`)

---

## Instalación y Ejecución Local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno** en `.env` (o `.env.local`) con las credenciales de tu proyecto Firebase:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   # Opcional: define "false" para deshabilitar el acceso local/local de pruebas
   NEXT_PUBLIC_ADMIN_TEST_LOGIN=true
   ```

3. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

4. **Comandos adicionales**:
   ```bash
   npm run build   # Compila la aplicación para producción
   npm run start   # Inicia el servidor compilado
   npm run lint    # Verifica reglas de ESLint
   ```
