-- Tarefas recorrentes diárias
CREATE TABLE IF NOT EXISTS "TarefaDiaria" (
  "id"        TEXT PRIMARY KEY,
  "nome"      TEXT NOT NULL,
  "descricao" TEXT,
  "ativa"     BOOLEAN NOT NULL DEFAULT true,
  "ordem"     INTEGER NOT NULL DEFAULT 0,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Registros de conclusão diária (um por tarefa por dia)
CREATE TABLE IF NOT EXISTS "RegistroDiario" (
  "id"        TEXT PRIMARY KEY,
  "tarefaId"  TEXT NOT NULL REFERENCES "TarefaDiaria"("id") ON DELETE CASCADE,
  "usuarioId" TEXT NOT NULL REFERENCES "User"("id"),
  "data"      TIMESTAMP(3) NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegistroDiario_tarefaId_data_key" UNIQUE ("tarefaId", "data")
);

CREATE INDEX IF NOT EXISTS "RegistroDiario_data_idx" ON "RegistroDiario"("data");

-- Tarefa inicial
INSERT INTO "TarefaDiaria" ("id", "nome", "descricao", "ativa", "ordem")
VALUES (
  'tarefa_escuteiras_01',
  'Verificar documentos das escuteiras',
  'Verificar os documentos, enviar para assinatura e confirmar se foram assinados.',
  true,
  1
) ON CONFLICT DO NOTHING;
