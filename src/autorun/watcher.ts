import { NS, ProcessInfo } from "@ns";

export async function main(ns: NS): Promise<void> {
  const hashes: Record<string, number> = {};

  const files = ns.ls("home", ".js");
  for (const file of files) {
    const contents = ns.read(file) as string;
    hashes[file] = getHash(contents);
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const files = ns.ls("home", ".js");

    for (const file of files) {
      const contents = ns.read(file) as string;
      const hash = getHash(contents);

      if (hash !== hashes[file]) {
        const ramUsage = ns.getScriptRam(file);
        ns.tprintf(`INFO: Detected change in ${file}`);
        ns.tprintf(`INFO: ${file} will use ${ramUsage}GB of ram`);
        const processes = ns.ps().filter((p: ProcessInfo) => {
          return p.filename === file;
        });

        for (const process of processes) {
          ns.tprintf(
            `INFO: Restarting ${process.filename} ${process.args} -t ${process.threads}`,
          );
          if (process.filename !== ns.getScriptName()) {
            ns.kill(process.pid);
            ns.run(process.filename, process.threads, ...process.args);
          } else {
            ns.spawn(process.filename, process.threads, ...process.args);
          }
        }

        if (processes.length === 0 && /\/autorun\/.*/.exec(file)) {
          ns.tprintf(`INFO: triggering autorun script ${file}`);
          ns.run(file, 1);
        }

        hashes[file] = hash;
      }
    }

    await ns.asleep(1000);
  }
}

const getHash = (input: string): number => {
  let hash = 0,
    i,
    chr;
  if (input.length === 0) return hash;
  for (i = 0; i < input.length; i++) {
    chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
