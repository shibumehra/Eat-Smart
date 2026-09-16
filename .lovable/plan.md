# Grounded nutrition, product history, and food database

## Goal
Make every report traceable to stored Open Food Facts or USDA data, calculate health and nutrition-value scores from serving-level facts, and give signed-in users a useful search dashboard.

## What will change

### 1. Normalize and store real food records
- Add a `food_products` table keyed by normalized brand, variant, and region, with barcode/source IDs, serving size, nutrition facts, ingredients, source timestamps, and the raw source evidence needed for audits.
- Match Open Food Facts first for packaged products and use USDA FoodData Central only when the first source is missing or too weak.
- Reject weak matches instead of filling gaps from model memory. Store aliases so common spelling differences resolve to the same product.
- Keep writes server-only; signed-in users may read grounded product records used by reports.

### 2. Make nutrition and scoring deterministic
- Extract serving size, calories, protein, carbohydrate, sugars, fibre, fat, saturated fat, and sodium into a normalized structure with units and per-serving/per-100g context.
- Pass those facts into health advice and require every recommendation to cite only provided quantities.
- Replace the subjective “Value for Money” score with a deterministic “Nutrition Value” score because price data is not available. Calculate it from sourced nutrition and ingredient classifications; show “Not enough data” when required facts are missing.
- Display serving size and key nutrition facts in the report.

### 3. Track searches and score changes
- Add private per-user search events and score snapshots, with row-level access restricted to the owning user.
- Record both fresh and cached searches so frequency is accurate, while preserving snapshots only when the report changes.
- Add a protected Dashboard page showing most searched products, current score, search count, last searched time, and chronological score changes.
- Add Dashboard navigation to the signed-in profile menu.

### 4. Validate the complete flow
- Add focused tests for source matching, nutrition normalization, deterministic score calculation, and missing-data behavior.
- Deploy the updated analysis function and database changes.
- Run a signed-in product search end to end, verify each streamed loading stage, confirm stored grounded facts, and check the report and dashboard at phone and desktop widths.

## Technical details
- New public tables will include explicit grants before RLS policies. Product source writes remain service-role-only; history policies use the authenticated user ID.
- Existing 30-day report caching remains, but cache validity will also depend on the new report/schema version.
- USDA’s public `DEMO_KEY` will be used as a limited fallback unless a dedicated USDA key is later configured; failures produce insufficient-evidence results rather than guessed values.
- Existing legacy cache rows remain readable only if they match the new report version; otherwise they regenerate from source data.
