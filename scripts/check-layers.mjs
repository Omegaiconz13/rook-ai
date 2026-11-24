#!/usr/bin/env node
/*
  The layer rule, enforced. Dependencies point inward:

    L5 view      src/pages, src/sections, src/components, src/App.tsx
    L4 edge      src/worker
    L3 adapters  src/lib
    L2 agent     src/shared/ninth
    L1 engine    src/shared
    L0 domain    src/shared (risk, journal, sizing, …)

  A view may import anything below it. The engine may import nothing above itself,
  and `src/shared` may not know that a browser exists. Two exemptions are real and
  written down rather than implied:

    - tests may import upward, because an integration test is the seam's proof;
    - a `.tsx` adapter in `src/lib` may mount a component (`ninth-panel.tsx` plugs a
      React panel into Vela). A `.ts` adapter may not: it is transport, not view.

  Usage: node scripts/check-layers.mjs [--self-test]
*/
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = posix.join(posix.dirname(fileURLToPath(import.meta.url)), '..')

const RULES = [
  {
    name: 'shared is framework-free',
    from: /^src\/shared\//,
    forbid: [/^react$/, /^react-dom/, /^lucide-react$/, /^@luxalgo\//, /^motion(\/|$)/, /^hono(\/|$)/],
    why: 'the engine runs in a test, a worker and a browser; a UI import makes that false',
  },
  {
    name: 'shared imports nothing outside shared',
    from: /^src\/shared\//,
    forbid: [/^(\.\.\/)+(lib|components|pages|sections|worker)\//, /^src\/(lib|components|pages|sections|worker)\//],
    why: 'L1/L2 may not reach up into an adapter, an edge or a view',
  },
  {
    name: 'adapters do not import views',
    from: /^src\/lib\/[^/]+\.ts$/,
    forbid: [/^\.\.\/(pages|sections|components|worker)\//, /^src\/(pages|sections|components|worker)\//],
    why: 'a .ts adapter is transport; mounting a component belongs in a .tsx adapter',
  },
  {
    name: 'the edge does not import the app',
    from: /^src\/worker\//,
    forbid: [/^\.\.\/(lib|pages|sections|components)\//, /^src\/(lib|pages|sections|components)\//, /^(react$|react-dom)/],
    why: 'the Worker runs where none of that exists',
  },
  {
    name: 'views do not call the edge directly',
    from: /^src\/(pages|sections|components)\/|^src\/App\.tsx$/,
    forbid: [/^(\.\.\/)+(worker)\//, /^src\/worker\//],
    why: 'a page talks to lib/desk, which owns the contract with the Worker',
  },
]

const SPECIFIER = /\bfrom\s+['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|\bimport\s+['"]([^'"]+)['"]/g

/** Every `from '…'`, `import('…')` and bare `import '…'` in a file, with line numbers. */
export function specifiers(text) {
  const out = []
  for (const line of text.split('\n')) {
    if (/^\s*(\/\/|\*)/.test(line)) continue
    for (const m of line.matchAll(SPECIFIER)) {
      const spec = m[1] ?? m[2] ?? m[3]
      if (spec && !spec.startsWith('bun:') && spec !== 'bun:test') out.push(spec)
    }
  }
  return out
}

/** Resolve a relative specifier against the importing file, keeping it repo-relative. */
function resolveSpecifier(file, spec) {
  if (spec.startsWith('.')) return posix.normalize(posix.join(posix.dirname(file), spec))
  return spec
}

const isTest = (file) => /\.test\.tsx?$/.test(file)

/** The violations in one file's source. Pure, so the self-test can call it. */
export function checkFile(file, text) {
  if (isTest(file)) return []
  const found = []
  for (const rule of RULES) {
    if (!rule.from.test(file)) continue
    for (const raw of specifiers(text)) {
      const spec = resolveSpecifier(file, raw)
      if (!rule.forbid.some((re) => re.test(spec))) continue
      found.push({ file, spec: raw, rule: rule.name, why: rule.why })
    }
  }
  return found
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name !== 'node_modules') walk(full, out)
      continue
    }
    if (/\.tsx?$/.test(name)) out.push(full)
  }
  return out
}

function selfTest() {
  const cases = [
    { file: 'src/shared/risk.ts', text: "import { useState } from 'react'", hits: 1 },
    { file: 'src/shared/risk.ts', text: "import { money } from './sizing'", hits: 0 },
    { file: 'src/shared/a.ts', text: "import { Button } from '../components/Button'", hits: 1 },
    { file: 'src/shared/ninth/loop.ts', text: "import { fetchJson } from '../../lib/http'", hits: 1 },
    { file: 'src/lib/ninth-client.ts', text: "import { NinthPanel } from '../components/NinthPanel'", hits: 1 },
    { file: 'src/lib/ninth-panel.tsx', text: "import { NinthPanel } from '../components/NinthPanel'", hits: 0 },
    { file: 'src/worker/index.ts', text: "import { deskFor } from '../lib/desk'", hits: 1 },
    { file: 'src/pages/Home.tsx', text: "import app from '../worker/index'", hits: 1 },
    { file: 'src/shared/ninth/remote-turn.test.ts', text: "import app from '../../worker/index'", hits: 0 },
  ]
  let failed = 0
  for (const c of cases) {
    const hits = checkFile(c.file, c.text).length
    if (hits !== c.hits) {
      failed++
      console.error(`  self-test FAIL  ${c.file}  expected ${c.hits} hit(s), got ${hits}`)
    }
  }
  if (failed) {
    console.error(`check-layers: ${failed} self-test case(s) failed`)
    process.exit(1)
  }
  console.log(`check-layers: self-test ok (${cases.length} cases)`)
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest()
  const files = walk(join(ROOT, 'src')).map((f) => posix.normalize(f.slice(ROOT.length + 1)))
  const violations = files.flatMap((file) => checkFile(file, readFileSync(join(ROOT, file), 'utf8')))
  if (violations.length === 0) {
    console.log(`check-layers: ${files.length} files, ${RULES.length} rules, no violations`)
    return
  }
  for (const v of violations) console.error(`${v.file}\n  imports ${v.spec}\n  breaks "${v.rule}": ${v.why}`)
  console.error(`\ncheck-layers: ${violations.length} violation(s)`)
  process.exit(1)
}

main()
