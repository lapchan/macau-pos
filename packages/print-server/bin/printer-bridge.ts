#!/usr/bin/env node
import { startDaemon, setupGracefulShutdown } from "../src/daemon.js";
import { logging } from "../src/util/logging.js";

const USAGE = `printer-bridge — cross-platform POS print daemon

Commands:
  start                      start the HTTP daemon (default in service mode)
  stop                       send SIGTERM to running daemon (not yet wired)
  install --bootstrap <jwt>  bootstrap this device against the admin server
  uninstall                  remove daemon, tunnel config, and service unit
  upgrade [--auto|--force <ver>]
  status                     print local daemon status
  rotate-token               emergency local token rotation (support tool)
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0];

  switch (cmd) {
    case "start": {
      const handle = await startDaemon();
      setupGracefulShutdown(handle);
      return;
    }

    case "stop":
    case "install":
    case "uninstall":
    case "upgrade":
    case "status":
    case "rotate-token": {
      logging.warn(`command '${cmd}' not yet implemented — sub-phase J/K/L`);
      process.exit(2);
      return;
    }

    case undefined:
    case "-h":
    case "--help":
      process.stdout.write(USAGE);
      process.exit(0);
      return;

    default:
      process.stderr.write(`unknown command: ${cmd}\n\n${USAGE}`);
      process.exit(1);
  }
}

main().catch((err) => {
  logging.error("bridge fatal", { err: (err as Error).message });
  process.exit(1);
});
