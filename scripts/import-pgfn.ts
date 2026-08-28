/**
 * Script de importação dos dados abertos da PGFN para o Supabase.
 *
 * Como usar:
 *   npx ts-node scripts/import-pgfn.ts
 *
 * O script baixa os 3 arquivos ZIP da PGFN, extrai os CSVs,
 * e importa os registros para a tabela pgfn_devedores no Supabase.
 * Tempo estimado: 10-30 minutos dependendo da internet.
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const prisma = new PrismaClient();

const ARQUIVOS = [
  {
    url: "https://dadosabertos.pgfn.gov.br/2026_trimestre_01/Dados_abertos_Nao_Previdenciario.zip",
    tipo: "NaoPrevidenciario",
  },
  {
    url: "https://dadosabertos.pgfn.gov.br/2026_trimestre_01/Dados_abertos_Previdenciario.zip",
    tipo: "Previdenciario",
  },
  {
    url: "https://dadosabertos.pgfn.gov.br/2026_trimestre_01/Dados_abertos_FGTS.zip",
    tipo: "FGTS",
  },
];

const TMP = path.join(process.cwd(), "tmp_pgfn");
const BATCH = 500;

function baixarArquivo(url: string, destino: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const arquivo = fs.createWriteStream(destino);
    const protocolo = url.startsWith("https") ? https : http;

    function request(u: string) {
      protocolo.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          request(res.headers.location!);
          return;
        }
        const total = parseInt(res.headers["content-length"] ?? "0");
        let baixado = 0;
        let ultimo = 0;

        res.on("data", (chunk: Buffer) => {
          baixado += chunk.length;
          const pct = total ? Math.floor((baixado / total) * 100) : 0;
          if (pct !== ultimo && pct % 5 === 0) {
            process.stdout.write(`\r  Baixando... ${pct}% (${(baixado / 1e6).toFixed(0)}MB)`);
            ultimo = pct;
          }
        });

        res.pipe(arquivo);
        res.on("end", () => {
          console.log();
          resolve();
        });
        res.on("error", reject);
      }).on("error", reject);
    }

    request(url);
    arquivo.on("error", reject);
  });
}

function extrairZip(zipPath: string, destDir: string): void {
  // Usa PowerShell no Windows, unzip no Linux/Mac
  if (process.platform === "win32") {
    execSync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`,
      { stdio: "inherit" }
    );
  } else {
    execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { stdio: "inherit" });
  }
}

function normalizarCnpj(v: string): string {
  return v.replace(/\D/g, "");
}

// Mapeia o cabeçalho do CSV para as colunas que precisamos
function mapearColunas(headers: string[]): Record<string, number> {
  const mapa: Record<string, number> = {};
  headers.forEach((h, i) => {
    const norm = h.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    mapa[norm] = i;
  });
  return mapa;
}

function getCol(cols: string[], mapa: Record<string, number>, ...chaves: string[]): string {
  for (const chave of chaves) {
    const norm = chave.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    if (mapa[norm] !== undefined) {
      return (cols[mapa[norm]] ?? "").trim();
    }
  }
  return "";
}

async function importarCSV(csvPath: string, tipo: string): Promise<number> {
  const rl = readline.createInterface({
    input: fs.createReadStream(csvPath, { encoding: "latin1" }),
    crlfDelay: Infinity,
  });

  let primeiraLinha = true;
  let mapa: Record<string, number> = {};
  let separador = ";";
  let batch: object[] = [];
  let total = 0;

  for await (const linha of rl) {
    if (!linha.trim()) continue;

    if (primeiraLinha) {
      // Detecta separador
      separador = linha.includes(";") ? ";" : ",";
      const headers = linha.split(separador);
      mapa = mapearColunas(headers);
      console.log(`  Colunas detectadas: ${headers.map(h => h.trim()).join(", ")}`);
      primeiraLinha = false;
      continue;
    }

    const cols = linha.split(separador);
    const cnpj = normalizarCnpj(
      getCol(cols, mapa, "CPF_CNPJ", "CNPJ_CPF", "CPF", "CNPJ")
    );
    if (!cnpj) continue;

    batch.push({
      cpfCnpj: cnpj,
      nomeDevedor: getCol(cols, mapa, "NOME_DEVEDOR", "NOME", "RAZAO_SOCIAL"),
      ufDevedor: getCol(cols, mapa, "UF_DEVEDOR", "UF"),
      tipoDevedor: getCol(cols, mapa, "TIPO_DEVEDOR", "TIPO_PESSOA"),
      situacaoInscricao: getCol(cols, mapa, "SITUACAO_INSCRICAO", "SITUACAO"),
      tipoSituacao: getCol(cols, mapa, "TIPO_SITUACAO_INSCRICAO", "TIPO_SITUACAO"),
      valorConsolidado: getCol(cols, mapa, "VALOR_CONSOLIDADO", "VALOR"),
      dataInscricao: getCol(cols, mapa, "DATA_INSCRICAO", "DATA"),
      indicadorAjuizado: getCol(cols, mapa, "INDICADOR_AJUIZADO", "AJUIZADO"),
      tipoDivida: tipo,
    });

    if (batch.length >= BATCH) {
      await prisma.pgfnDevedor.createMany({ data: batch as any, skipDuplicates: true });
      total += batch.length;
      batch = [];
      process.stdout.write(`\r  Inseridos: ${total.toLocaleString("pt-BR")}`);
    }
  }

  if (batch.length > 0) {
    await prisma.pgfnDevedor.createMany({ data: batch as any, skipDuplicates: true });
    total += batch.length;
  }

  console.log(`\r  Inseridos: ${total.toLocaleString("pt-BR")} registros`);
  return total;
}

async function main() {
  console.log("=== Importação PGFN — Dívida Ativa da União ===\n");

  // Garante diretório temporário
  if (!fs.existsSync(TMP)) fs.mkdirSync(TMP);

  // Limpa tabela antes de reimportar
  console.log("Limpando tabela anterior...");
  await prisma.pgfnDevedor.deleteMany();
  console.log("OK\n");

  let totalGeral = 0;

  for (const { url, tipo } of ARQUIVOS) {
    const nomeZip = path.basename(url);
    const zipPath = path.join(TMP, nomeZip);
    const extDir = path.join(TMP, tipo);

    console.log(`\n── ${tipo} ──`);

    // Download
    if (fs.existsSync(zipPath)) {
      console.log(`  ZIP já existe, pulando download.`);
    } else {
      console.log(`  Baixando ${nomeZip}...`);
      await baixarArquivo(url, zipPath);
    }

    // Extração
    if (!fs.existsSync(extDir)) fs.mkdirSync(extDir);
    console.log("  Extraindo ZIP...");
    extrairZip(zipPath, extDir);

    // Encontra o CSV extraído
    const csvs = fs.readdirSync(extDir).filter(f => f.toLowerCase().endsWith(".csv"));
    if (csvs.length === 0) {
      console.error(`  ERRO: Nenhum CSV encontrado em ${extDir}`);
      continue;
    }

    for (const csv of csvs) {
      const csvPath = path.join(extDir, csv);
      console.log(`  Importando ${csv}...`);
      const n = await importarCSV(csvPath, tipo);
      totalGeral += n;
    }
  }

  console.log(`\n✓ Importação concluída! Total: ${totalGeral.toLocaleString("pt-BR")} registros`);

  // Limpeza dos ZIPs (mantém para não baixar de novo se rodar outra vez)
  console.log(`  Arquivos temporários em: ${TMP}`);
  console.log("  (Você pode apagar a pasta tmp_pgfn manualmente quando quiser)");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
