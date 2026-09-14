# Fix certification, scoring, and branding

## What will change
- Keep the certification information fully visible on phones and anchored to the right side of its card.
- Use the supplied EatSmart icon in the top bar and browser tab.
- Show the supplied green EatSmart artwork as a short launch screen while the app session loads.
- Correct regulatory reporting so approval, registration, and compliance are not guessed or conflated.
- Make ingredient purity scoring deterministic from the sourced ingredient classifications, with conservative handling when evidence is incomplete.
- Refresh affected cached reports so Coca-Cola and other products use the corrected rules.

## Technical details
- Extend the source evidence with authority-relevant label and identifier fields already available from Open Food Facts, then require explicit evidence for any positive certification status.
- Separate regulatory status from generic product availability: if explicit approval or registration evidence is absent, show a clear evidence-limited status and explanation rather than a fabricated certification.
- Compute ingredient purity from validated ingredient statuses instead of accepting an unconstrained model score; penalize harmful/caution/unknown ingredients with documented weights and reduce confidence for incomplete lists.
- Replace the clipped absolute tooltip with a viewport-safe right-aligned overlay on mobile.
- Add focused tests for regulatory normalization and ingredient scoring, deploy the analysis function, and verify the mobile result flow.
