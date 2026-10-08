#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Native (no-Docker) OpenFGA lifecycle helper.
//
//   pnpm openfga:install   download + unpack the OpenFGA binary into .tools/
//   pnpm openfga:up        install (if needed) -> start the server -> publish
//                          the authorization model + relationship tuples
//   pnpm openfga:down      stop the server
//   pnpm openfga:status    report whether the server is reachable
//
// Configuration is read from the root .env (OPENFGA_API_URL) with optional
// overrides: OPENFGA_VERSION, OPENFGA_HTTP_PORT, OPENFGA_GRPC_PORT,
// OPENFGA_DATASTORE_ENGINE, OPENFGA_DATASTORE_URI.
// ---------------------------------------------------------------------------

import {
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { spawn, spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const TOOLS_DIR = path.join(ROOT, ".tools")
const LOG_FILE = path.join(TOOLS_DIR, "openfga.log")
const PID_FILE = path.join(TOOLS_DIR, "openfga.pid")

const IS_WINDOWS = process.platform === "win32"
const BIN_NAME = IS_WINDOWS ? "openfga.exe" : "openfga"
const BIN_PATH = path.join(TOOLS_DIR, BIN_NAME)

const OS = { win32: "windows", darwin: "darwin", linux: "linux" }[
  process.platform
]
const ARCH = { x64: "amd64", arm64: "arm64" }[process.arch]
const VERSION = process.env.OPENFGA_VERSION ?? "1.22.0"

// --- configuration ---------------------------------------------------------

function readDotEnv() {
  const file = path.join(ROOT, ".env")
  const values = {}
  if (!existsSync(file)) return values
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
    if (!match) continue
    let value = match[2]
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    if (quoted) value = value.slice(1, -1)
    values[match[1]] = value
  }
  return values
}

const dotenv = readDotEnv()
const setting = (key) => process.env[key] ?? dotenv[key]

function resolveConfig() {
  const apiUrl = (
    setting("OPENFGA_API_URL") ?? "http://localhost:8080"
  ).replace(/\/$/, "")
  let httpPort = Number(process.env.OPENFGA_HTTP_PORT ?? "")
  if (!httpPort) {
    try {
      httpPort = Number(new URL(apiUrl).port) || 8080
    } catch {
      httpPort = 8080
    }
  }
  const grpcPort = Number(setting("OPENFGA_GRPC_PORT") ?? httpPort + 1)
  const engine = setting("OPENFGA_DATASTORE_ENGINE") ?? "memory"
  const uri = setting("OPENFGA_DATASTORE_URI")
  return { apiUrl, httpPort, grpcPort, engine, uri }
}

function serverEnv(config) {
  const env = {
    ...process.env,
    OPENFGA_DATASTORE_ENGINE: config.engine,
    OPENFGA_HTTP_ADDR: `0.0.0.0:${config.httpPort}`,
    OPENFGA_GRPC_ADDR: `0.0.0.0:${config.grpcPort}`,
    OPENFGA_PLAYGROUND_ENABLED: "false",
    OPENFGA_LOG_FORMAT: "json",
  }
  if (config.uri) env.OPENFGA_DATASTORE_URI = config.uri
  return env
}

// --- helpers ---------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function readPid() {
  if (!existsSync(PID_FILE)) return null
  const pid = Number(readFileSync(PID_FILE, "utf8").trim())
  return Number.isInteger(pid) && pid > 0 ? pid : null
}

function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function isReachable(apiUrl) {
  try {
    const res = await fetch(`${apiUrl}/stores`, {
      signal: AbortSignal.timeout(2000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function waitForReady(apiUrl) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await isReachable(apiUrl)) return true
    await sleep(500)
  }
  return false
}

// --- commands --------------------------------------------------------------

async function install() {
  mkdirSync(TOOLS_DIR, { recursive: true })

  if (existsSync(BIN_PATH)) {
    console.log(`✓ OpenFGA binary already present: ${BIN_PATH}`)
    return
  }
  if (!OS || !ARCH) {
    throw new Error(`Unsupported platform: ${process.platform}/${process.arch}`)
  }

  const asset = `openfga_${VERSION}_${OS}_${ARCH}.tar.gz`
  const url = `https://github.com/openfga/openfga/releases/download/v${VERSION}/${asset}`
  const archive = path.join(TOOLS_DIR, asset)

  console.log(`→ Downloading OpenFGA v${VERSION} (${OS}/${ARCH})...`)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText} (${url})`)
  }
  writeFileSync(archive, Buffer.from(await res.arrayBuffer()))

  console.log(`→ Extracting ${asset}...`)
  const tar = spawnSync("tar", ["-xzf", archive, "-C", TOOLS_DIR], {
    stdio: "inherit",
  })
  if (tar.status !== 0) {
    throw new Error(
      "Failed to extract the archive — is a `tar` command available?"
    )
  }
  rmSync(archive, { force: true })
  if (!IS_WINDOWS) chmodSync(BIN_PATH, 0o755)
  if (!existsSync(BIN_PATH)) {
    throw new Error(`Expected binary not found after extraction: ${BIN_PATH}`)
  }
  console.log(`✓ Installed ${BIN_PATH}`)
}

async function start() {
  const config = resolveConfig()
  const env = serverEnv(config)

  const pid = readPid()
  if (pid && isAlive(pid) && (await isReachable(config.apiUrl))) {
    console.log(`✓ OpenFGA already running (pid ${pid}) at ${config.apiUrl}`)
    return
  }
  if (pid) rmSync(PID_FILE, { force: true })

  if (config.engine !== "memory") {
    console.log(`→ Running OpenFGA migrations (${config.engine} datastore)...`)
    const migrate = spawnSync(BIN_PATH, ["migrate"], { env, stdio: "inherit" })
    if (migrate.status !== 0) throw new Error("OpenFGA migrate failed")
  }

  console.log(
    `→ Starting OpenFGA (${config.engine} datastore) — HTTP :${config.httpPort}, gRPC :${config.grpcPort}...`
  )
  mkdirSync(TOOLS_DIR, { recursive: true })
  const logFd = openSync(LOG_FILE, "a")
  const child = spawn(BIN_PATH, ["run"], {
    env,
    cwd: TOOLS_DIR,
    detached: true,
    stdio: ["ignore", logFd, logFd],
  })
  child.unref()
  closeSync(logFd)
  writeFileSync(PID_FILE, String(child.pid))

  if (!(await waitForReady(config.apiUrl))) {
    throw new Error(
      `OpenFGA did not become ready. Check the logs at ${LOG_FILE}`
    )
  }
  console.log(`✓ OpenFGA ready (pid ${child.pid}) at ${config.apiUrl}`)
  console.log(`  logs: ${LOG_FILE}`)
}

function publishModelAndTuples() {
  console.log("→ Publishing the authorization model and relationship tuples...")
  const res = spawnSync("pnpm --filter @workspace/authz fga:setup", {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  })
  if (res.status !== 0)
    throw new Error("Publishing the OpenFGA model/tuples failed")
}

async function stop() {
  const pid = readPid()
  if (!pid) {
    console.log("OpenFGA is not running (no pid file).")
    return
  }
  if (!isAlive(pid)) {
    rmSync(PID_FILE, { force: true })
    console.log(`OpenFGA is not running (removed stale pid ${pid}).`)
    return
  }
  try {
    process.kill(pid)
  } catch {
    // already gone
  }
  rmSync(PID_FILE, { force: true })
  console.log(`✓ Stopped OpenFGA (pid ${pid}).`)
}

async function status() {
  const config = resolveConfig()
  if (await isReachable(config.apiUrl)) {
    const pid = readPid()
    console.log(
      `✓ OpenFGA reachable at ${config.apiUrl} (pid ${pid ?? "unknown"}, gRPC :${config.grpcPort})`
    )
  } else {
    console.log(`✗ OpenFGA not reachable at ${config.apiUrl}`)
  }
}

// --- entry point -----------------------------------------------------------

const command = process.argv[2] ?? "up"

try {
  if (command === "install") {
    await install()
  } else if (command === "up") {
    await install()
    await start()
    publishModelAndTuples()
  } else if (command === "down" || command === "stop") {
    await stop()
  } else if (command === "status") {
    await status()
  } else {
    console.error(
      `Unknown command: ${command}. Use install | up | down | status.`
    )
    process.exit(1)
  }
} catch (error) {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
