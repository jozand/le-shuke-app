// scripts/check-api-routes.ts
//
// Analiza todos los app/api/**/route.ts y detecta
// rutas dinámicas que NO usan params: Promise<...> en los handlers.
//
// Se puede ejecutar con: npx tsx scripts/check-api-routes.ts

import fs from 'fs';
import path from 'path';

const API_ROOT = path.join(process.cwd(), 'app', 'api');

type RouteIssue = {
  file: string;
  reasons: string[];
};

function isDynamicRoute(filePath: string): boolean {
  // Ej: app/api/metodos-pago/[id]/route.ts
  return /\[[^/]+\]/.test(filePath);
}

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function walkDir(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, files);
    } else if (entry.isFile() && entry.name === 'route.ts') {
      files.push(fullPath);
    }
  }

  return files;
}

function analyzeRouteFile(filePath: string): RouteIssue | null {
  const isDynamic = isDynamicRoute(filePath);
  if (!isDynamic) return null;

  const content = readFileSafe(filePath);
  if (!content) return null;

  const reasons: string[] = [];

  // Buscamos firmas de handlers export async function GET/POST/PUT/DELETE...
  // y revisamos el segundo parámetro
  //
  // Casos problemáticos típicos:
  //   (_req: NextRequest, { params }: { params: { id: string } })
  //   (req: NextRequest, context: { params: { pedidoId: string } })
  //
  // Lo correcto:
  //   (_req: NextRequest, { params }: { params: Promise<{ id: string }> })

  const handlerRegex =
    /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([\s\S]*?\)\s*{/g;

  const matches = content.match(handlerRegex) || [];

  for (const match of matches) {
    // Revisamos solo la parte de parámetros del match
    const paramsSectionMatch = match.match(/\(([\s\S]*?)\)/);
    if (!paramsSectionMatch) continue;

    const paramsSection = paramsSectionMatch[1];

    // Si la ruta es dinámica, esperamos ver Promise<...> en la definición del segundo parámetro
    const usesPromiseParams = /params\s*:\s*Promise<\s*{[^}]+}\s*>/.test(
      paramsSection
    );

    if (!usesPromiseParams) {
      reasons.push(
        `Handler "${match
          .replace(/\s+/g, ' ')
          .trim()}" no usa "params: Promise<...>" en el segundo parámetro.`
      );
    }
  }

  // Además, detectamos patrones explícitos incorrectos:
  //   { params }: { params: { id: string } }
  const badParamsPattern = /{?\s*params\}\s*:\s*{[^}]*params\s*:\s*{\s*[^}]*}\s*}/;
  if (badParamsPattern.test(content)) {
    reasons.push(
      'Se detectó un patrón "{ params }: { params: { ... } }" en una ruta dinámica. Debe ser "{ params }: { params: Promise<{ ... }> }".'
    );
  }

  if (reasons.length === 0) return null;

  return {
    file: path.relative(process.cwd(), filePath),
    reasons,
  };
}

function main() {
  console.log('🔍 Analizando endpoints en app/api/**/route.ts ...\n');

  if (!fs.existsSync(API_ROOT)) {
    console.error(`❌ No se encontró el directorio: ${API_ROOT}`);
    process.exit(1);
  }

  const routeFiles = walkDir(API_ROOT);

  if (routeFiles.length === 0) {
    console.log('⚠️ No se encontraron archivos route.ts en app/api.');
    process.exit(0);
  }

  const issues: RouteIssue[] = [];

  for (const file of routeFiles) {
    const issue = analyzeRouteFile(file);
    if (issue) issues.push(issue);
  }

  if (issues.length === 0) {
    console.log('✅ Todos los endpoints dinámicos parecen usar params: Promise<...> correctamente.\n');
    process.exit(0);
  }

  console.log('⚠️ Se encontraron problemas en los siguientes endpoints dinámicos:\n');

  for (const issue of issues) {
    console.log(`📁 ${issue.file}`);
    for (const reason of issue.reasons) {
      console.log(`   • ${reason}`);
    }
    console.log('');
  }

  console.log(
    '💡 Revisa cada archivo listado y cambia el segundo parámetro de los handlers a:\n' +
    '   { params }: { params: Promise<{ ... }> }\n'
  );

  // Salimos con código 1 para que pueda integrarse en CI o antes del build
  process.exit(1);
}

main();
