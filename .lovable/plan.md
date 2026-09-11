# Trustworthy, scalable product analysis

## Goal
Make every uncached analysis use current product facts, reduce AI failures and cost, protect public usage, and improve perceived and actual speed.

## Build
1. **Ground facts first**
   - Search Open Food Facts by the entered product name.
   - Rank close brand/product matches and pass only sourced ingredients, nutrition, labels, and identifiers into analysis.
   - Clearly mark results as grounded or limited-data; never invent missing facts.

2. **Stage the analysis**
   - Replace the single large prompt with focused fact interpretation and scoring/verdict stages.
   - Generate the witty verdict from the grounded/scored result without allowing it to change facts.
   - Validate each stage and retry malformed model output once with a correction prompt.

3. **Protect and clean the cache**
   - Expire cached analyses after 30 days and store grounding metadata.
   - Use canonical normalized keys and atomic upserts so concurrent requests cannot create duplicates.
   - Add a server-side per-user/IP usage window for analysis and image recognition.

4. **Progressive experience**
   - Return live stage events so the loading screen reflects real work: source lookup, ingredient review, scoring, and report assembly.
   - Surface exact service errors and retry only rate limits or temporary service failures with bounded backoff.

5. **Frontend speed**
   - Lazy-load the report screen and comparison UI.
   - Resize and compress camera/gallery images before upload, with safe size and type limits.

## Technical details
- Keep Lovable AI as the AI provider and Open Food Facts as the current-data source.
- Use an authenticated streaming Edge Function and browser `fetch` for newline-delimited progress events.
- Retain the existing report shape so the current report UI remains compatible.
- Preserve region-specific certification handling and the existing visual design.
- The developer PIN bypass remains a local preview shortcut, but protected analysis requires a real signed-in account.

## Validation
- Test cached and uncached text searches, image identification, malformed-input handling, rate limits, and 30-day expiry.
- Confirm desktop/mobile report rendering, upload compression, progressive status updates, and a clean production build.
