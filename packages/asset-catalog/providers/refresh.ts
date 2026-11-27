import { writeFile, rename } from "node:fs/promises";
import { discoverOndo, discoverXstocks } from "./sources";

async function refresh(name: string, discover: typeof discoverXstocks) {
  const assets = await discover();
  if (!assets.length) throw new Error("Empty response");
  const path = new URL(`../registry/${name}.json`, import.meta.url);
  const temp = new URL(`../registry/.${name}-${process.pid}.tmp`, import.meta.url);
  await writeFile(temp, `{"verifiedAt":${JSON.stringify(new Date().toISOString())},"assets":[
${assets.map(asset => JSON.stringify(asset)).join(",\n")}
]}\n`, { flag: "wx" });
  await rename(temp, path);
  console.log(name, assets.length);
}

void Promise.allSettled([
  refresh("xstocks", discoverXstocks), refresh("ondo", discoverOndo),
]).then(results => {
  for (const result of results) {
    if (result.status === "rejected") {
      console.error(String(result.reason));
      process.exitCode = 1;
    }
  }
});
