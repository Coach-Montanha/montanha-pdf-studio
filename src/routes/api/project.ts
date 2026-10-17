import { createFileRoute } from "@tanstack/react-router";

interface SyncedRecord {
  code: string;
  project: any;
  syncedAt: string;
}

// Armazenamento em memória no servidor (Edge / Node)
const projectStore = new Map<string, SyncedRecord>();
let latestRecord: SyncedRecord | null = null;

// Armazenamento seguro de projetos de revista
export const Route = createFileRoute("/api/project")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const requestedCode = (url.searchParams.get("code") || "").trim().toUpperCase();

        let targetRecord: SyncedRecord | null = null;

        if (requestedCode && projectStore.has(requestedCode)) {
          targetRecord = projectStore.get(requestedCode)!;
        } else if (latestRecord) {
          targetRecord = latestRecord;
        }

        if (!targetRecord) {
          return new Response(
            JSON.stringify({
              error: "Nenhum projeto encontrado na nuvem para este código.",
              code: requestedCode || null,
            }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate",
              },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            code: targetRecord.code,
            project: targetRecord.project,
            syncedAt: targetRecord.syncedAt,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          }
        );
      },

      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as any;
          const project = body?.project;
          const code = (body?.code || "MONTANHA").trim().toUpperCase();

          if (!project || typeof project !== "object" || !Array.isArray(project.articles)) {
            return new Response(
              JSON.stringify({ error: "Estrutura do projeto inválida para sincronização." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const now = new Date().toISOString();
          const record: SyncedRecord = {
            code,
            project,
            syncedAt: now,
          };

          // Salvar em memória segura no servidor
          projectStore.set(code, record);
          latestRecord = record;

          return new Response(
            JSON.stringify({
              success: true,
              code,
              syncedAt: now,
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate",
              },
            }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: "Erro interno no servidor ao sincronizar projeto: " + err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
