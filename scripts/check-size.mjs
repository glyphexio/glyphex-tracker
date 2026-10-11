// Fails if the minified core reaches the gzip budget.
import { buildTracker } from "../build.mjs";

const BUDGET = 2000; // bytes, gzip -9

const { sizes } = await buildTracker();
console.log(`core: ${sizes.core} B gzip (budget ${BUDGET})`);
if (sizes.core >= BUDGET) {
  console.error("core is over budget");
  process.exit(1);
}
