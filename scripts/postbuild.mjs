// Strips files the Sites uploader refuses (hidden files and source maps)
// from the build output, so `deploy.json` can point straight at dist/.
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

function clean(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (name.startsWith('.') || name.endsWith('.map')) {
      rmSync(path, { recursive: true, force: true })
      continue
    }
    if (statSync(path).isDirectory()) clean(path)
  }
}

const dist = new URL('../dist', import.meta.url)
clean(dist.pathname)

// `deploy.json` is what Sites uploads, so a stale module path there fails the
// publish after a successful build. Vite writes the Worker under a folder named
// after `wrangler.jsonc`'s name, so check the manifest against the real output.
const manifest = JSON.parse(readFileSync(new URL('../deploy.json', import.meta.url), 'utf8'))
for (const module of manifest.modules) {
  const path = join(dist.pathname, '..', module.path)
  if (!existsSync(path)) {
    throw new Error(
      `deploy.json points at ${module.path}, which the build did not produce. ` +
        `The Worker bundle is named after "name" in wrangler.jsonc; update deploy.json to match.`,
    )
  }
}
