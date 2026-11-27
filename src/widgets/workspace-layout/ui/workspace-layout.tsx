import type { ReactNode } from "react";
import { WorkspaceAuthGuard } from "./workspace-auth-guard";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { WorkspaceTopbar } from "./workspace-topbar";

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceAuthGuard>
      <div className="flex min-h-dvh flex-1 bg-background">
        <WorkspaceSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <WorkspaceTopbar />
          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </WorkspaceAuthGuard>
  );
}

