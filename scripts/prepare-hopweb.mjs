import { cp, mkdir, rm } from 'node:fs/promises'

const source = new URL('../dist/', import.meta.url)
const target = new URL('../hopweb-app/', import.meta.url)

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })
await cp(source, target, { recursive: true })

console.log('HopWeb package prepared in hopweb-app/')
