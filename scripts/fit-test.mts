import { recommendSize, estimateBody, explainFit, DEFAULT_FIT_SETTINGS } from "../lib/fit/engine.ts";
import { seedProducts } from "../lib/db/seed.ts";

const [jacket, jeans, set] = seedProducts();

const cases = [
  { label: "slim 170/60 regular", a: { heightCm:170, weightKg:60, shape:"slim" as const, preference:"regular" as const } },
  { label: "avg 176/76 regular",  a: { heightCm:176, weightKg:76, shape:"average" as const, preference:"regular" as const } },
  { label: "avg 176/76 slim",     a: { heightCm:176, weightKg:76, shape:"average" as const, preference:"slim" as const } },
  { label: "avg 176/76 oversize", a: { heightCm:176, weightKg:76, shape:"average" as const, preference:"oversized" as const } },
  { label: "athl 185/92 regular", a: { heightCm:185, weightKg:92, shape:"athletic" as const, preference:"regular" as const } },
  { label: "full 180/105 reg",    a: { heightCm:180, weightKg:105, shape:"fuller" as const, preference:"regular" as const } },
];

for (const p of [jacket, jeans, set]) {
  console.log("\n=== " + p.name + " (" + p.garment_type + ") ===");
  for (const c of cases) {
    const r = recommendSize(p, c.a, DEFAULT_FIT_SETTINGS);
    const b = estimateBody(c.a);
    console.log(
      `${c.label.padEnd(24)} body(chest ${String(b.chest).padStart(5)} waist ${String(b.waist).padStart(5)}) -> ${String(r.recommended).padStart(6)}  target=${r.targetCm}  conf=${r.confidence}  alt=${r.alternative?.size ?? "-"}(${r.alternative?.direction ?? "-"})  inStock=${r.recommendedInStock}`
    );
  }
}

// degraded mode: product with no measurements
const bare = { garment_type: "accessory" as const, intrinsic_fit: "regular" as const, sizes: [{ size:"OS", stock: 4 }] };
const rb = recommendSize(bare, cases[1].a);
console.log("\n=== accessory w/o chart ===");
console.log("precise:", rb.precise, "| rec:", rb.recommended, "| conf:", rb.confidence);
console.log("explain:", explainFit(rb, cases[1].a, "en"));

// monotonicity check: bigger body must never map to a smaller size
console.log("\n=== monotonicity (jacket, regular fit) ===");
let prevIdx = -1, ok = true;
for (let w = 50; w <= 120; w += 5) {
  const r = recommendSize(jacket, { heightCm: 178, weightKg: w, shape: "average", preference: "regular" });
  const idx = jacket.sizes.findIndex(s => s.size === r.recommended);
  if (idx < prevIdx) { ok = false; console.log(`  REGRESSION at ${w}kg -> ${r.recommended}`); }
  prevIdx = idx;
  process.stdout.write(`${w}kg:${r.recommended}  `);
}
console.log("\nmonotonic:", ok ? "PASS" : "FAIL");
