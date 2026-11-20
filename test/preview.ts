import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))

function hasNodePreviewBuild(): boolean {
  try {
    const metadata = readFileSync(new URL('../.output/nitro.json', import.meta.url), 'utf8')
    return JSON.parse(metadata).preset === 'node-server'
  } catch {
    return false
  }
}

if (!hasNodePreviewBuild()) {
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' })
}
