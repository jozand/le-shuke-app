// scripts/checs-pages.ts
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

interface Issue {
  file: string;
  line: number;
  column: number;
  message: string;
}

function reportIssue(issues: Issue[]) {
  if (issues.length === 0) {
    console.log('✔ No se encontraron problemas en las páginas.');
    return;
  }

  console.log(`\n🔍 Problemas encontrados en ${issues.length} páginas:\n`);

  for (const issue of issues) {
    console.log(
      `🚨 ${issue.file}:${issue.line}:${issue.column} → ${issue.message}`
    );
  }
}

async function analizarArchivo(file: string) {
  const issues: Issue[] = [];
  const content = await fs.readFile(file, 'utf8');
  const lineas = content.split('\n');

  lineas.forEach((line, index) => {
    const n = index + 1;

    // ❗ Detectar uso de "any"
    if (/\bany\b/.test(line)) {
      issues.push({
        file,
        line: n,
        column: line.indexOf('any') + 1,
        message: 'Uso de any detectado',
      });
    }

    // ❗ "as any"
    if (line.includes('as any')) {
      issues.push({
        file,
        line: n,
        column: line.indexOf('as any') + 1,
        message: 'Conversión insegura "as any"',
      });
    }

    // ❗ useState sin tipo explícito
    if (/useState\(\)/.test(line)) {
      issues.push({
        file,
        line: n,
        column: line.indexOf('useState') + 1,
        message: 'useState sin genérico <T>',
      });
    }

    // ❗ Funciones con parámetro implícito (p.ej. catch (err))
    if (/catch\s*\(\s*[a-zA-Z_]+\s*\)/.test(line) && !/:\s*\w+/.test(line)) {
      issues.push({
        file,
        line: n,
        column: line.indexOf('catch') + 1,
        message: 'Parámetro de catch sin tipo (usa "catch(err: unknown)")',
      });
    }

    // ❗ Objetos literales con propiedades desconocidas
    if (/\{.*title:/.test(line) && !/ToastOptions/.test(content)) {
      issues.push({
        file,
        line: n,
        column: line.indexOf('{') + 1,
        message:
          'Posible objeto con propiedades incorrectas ("title" puede no existir en el tipo esperado)',
      });
    }

    // ❗ Variables sin inicializador ni tipo
    if (/let\s+[a-zA-Z_]+\s*;/.test(line)) {
      issues.push({
        file,
        line: n,
        column: line.indexOf('let') + 1,
        message: 'Variable sin tipo ni inicialización',
      });
    }
  });

  return issues;
}

async function run() {
  console.log('🔎 Buscando páginas en app/**/page.tsx...');
  const archivos = await glob('app/**/page.tsx');

  let problemas: Issue[] = [];

  for (const file of archivos) {
    const issues = await analizarArchivo(path.resolve(file));
    problemas = problemas.concat(issues);
  }

  reportIssue(problemas);
}

run();
