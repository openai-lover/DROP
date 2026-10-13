import { database } from "../src/server/db";
import { reconcileAll, workerTick } from "../src/server/worker";

let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });
const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function main() {
  if (process.argv.includes("--reconcile")) {
    console.log(JSON.stringify(await reconcileAll(), null, 2));
    return;
  }
  while (!stopping) {
    try {
      const worked = await workerTick();
      if (!worked) await pause(2000);
    } catch {
      // Never print SDK/RPC exceptions: a configured provider URL may contain a secret.
      console.error("DROP worker could not reach persistent storage or its provider; retrying.");
      await pause(5000);
    }
    if (process.argv.includes("--once")) break;
  }
}
main().catch(() => { console.error("DROP worker failed. Check private deployment configuration."); process.exitCode = 1; }).finally(async () => { if (process.env.FIREBASE_PROJECT_ID) await database().terminate(); });
