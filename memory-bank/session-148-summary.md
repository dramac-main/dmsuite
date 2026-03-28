# Session Summary — Certificate and Diploma Architecture Fix

## Date: March 28, 2026

## What Triggered This Work

Drake opened the certificate designer in the browser and saw visually poor output from the Canvas2D renderer. His reaction was "What is this crap?" followed by identifying that the wrong workspace architecture was active. He attached the TOOL-CREATION-GUIDE.md (2220 lines) and asked for a thorough audit to make sure everything follows the correct platform standard.

## The Core Problem We Discovered

There were two completely separate implementations for both the certificate and diploma tools, and everything was wired to the wrong one.

### The Wrong Implementation (Canvas2D — Was Active)

The Canvas2D versions used procedural drawing with arcs, bezier curves, rectangles, and other Canvas2D primitives. These produced basic-looking output. The files involved were CertificateDesignerWorkspace.tsx (top-level workspaces folder, about 500 lines), DiplomaCanvasWorkspace.tsx, and their backing stores certificate-canvas.ts and diploma-canvas.ts. These also relied on certificate-library.ts (80 procedural assets) and certificate-composer.ts / diploma-composer.ts for composing scene graphs.

### The Correct Implementation (Pattern A HTML/CSS — Was Dormant)

Fully built Pattern A workspaces already existed in dedicated folders: certificate-designer/ (7 files, 2487 total lines) and diploma-designer/ (7 files). These follow the TOOL-CREATION-GUIDE.md architecture exactly: a tabbed editor panel (Content, Details, Style, Format tabs) on the left, an HTML/CSS renderer in the center, and a Figma-style layers panel on the right. The renderers use professional HTML/CSS templates with inline SVG decorations. These were complete and production-ready but never wired up.

### What Was Wired Wrong

Four systems were pointing to the Canvas2D versions instead of the Pattern A versions:

First, the routing in page.tsx. The dynamic import for "certificate" loaded the Canvas2D CertificateDesignerWorkspace from the top-level workspaces folder. The import for "diploma-designer" loaded DiplomaCanvasWorkspace.

Second, the store adapters in store-adapters.ts. Both getCertificateAdapter and getDiplomaAdapter used the canvas stores (certificate-canvas and diploma-canvas) for project save/restore snapshots.

Third, the Chiko AI manifests in chiko/manifests/certificate.ts and diploma.ts. Both referenced the canvas stores, so Chiko's AI actions had no effect on the Pattern A workspaces.

Fourth, the Chiko registration in the certificate Pattern A workspace was explicitly disabled with a comment reading "disabled (old CSS workspace, replaced by canvas workspace)."

## What Was Fixed — File by File

### 1. page.tsx (Routing)

Changed two dynamic imports. The "certificate" case now imports from certificate-designer/CertificateDesignerWorkspace. The "diploma-designer" case now imports from diploma-designer/DiplomaDesignerWorkspace.

### 2. store-adapters.ts (Project Save/Restore)

Rewrote getCertificateAdapter to use useCertificateEditor (persist key "dmsuite-certificate"). The getSnapshot method now reads form and accentColorLocked from the editor store. The restore method uses setForm and the accent color lock setter. The reset method calls resetForm. The subscribe method hooks into useCertificateEditor.subscribe.

Rewrote getDiplomaAdapter identically but targeting useDiplomaEditor (persist key "dmsuite-diploma-editor") with the same pattern.

### 3. chiko/manifests/certificate.ts (Chiko AI Manifest — Full Rewrite)

Completely replaced the old manifest that used useCertificateCanvas. The new manifest uses useCertificateEditor and exposes these form-based actions: updateContent, updateOrganization, updateEvent, updateDates, setCertificateType, addSignatory (returns ID, then patches with name/title/role), updateSignatory (by index, resolves to ID for store call), removeSignatory (by index, resolves to ID), updateSeal, updateStyle (delegates to setTemplate, setAccentColor, and updateStyle for remaining fields), updateFormat, resetForm, readCurrentState, prefillFromMemory (from business memory), validateBeforeExport, and exportDocument (uses onPrintRef).

The CertificateManifestOptions interface now has a single onPrintRef field (a React ref to a print handler function) instead of the old onExportPng, onExportPdf, and onCopy refs. The withActivityLogging wrapper snapshots and restores using form and setForm.

### 4. chiko/manifests/diploma.ts (Chiko AI Manifest — Full Rewrite)

Same treatment as the certificate manifest but targeting useDiplomaEditor. Actions include: updateInstitution, updateRecipient, updateProgram (with programName not degreeName), updateConferral, updateAccreditation (separate from conferral now), updateDates, updateReference, setDiplomaType, addSignatory (returns ID from store), updateSignatory (index to ID resolution via form.signatories array), removeSignatory (index to ID resolution), updateSeal, updateStyle, updateFormat, resetForm, readCurrentState, prefillFromMemory, validateBeforeExport, and exportDocument via onPrintRef.

The DiplomaManifestOptions interface also uses only onPrintRef. The withActivityLogging wrapper snapshots form and restores via setForm.

The old manifest had actions like setStyle, setColorScheme, setSize, toggleFeatures, applyPreset, setHonors, regenerateSerial, resetDiploma, exportPng, exportPdf, and copyToClipboard — all of which referenced the canvas store methods and were completely replaced.

### 5. certificate-designer/CertificateDesignerWorkspace.tsx (Re-enable Chiko)

Added imports for useChikoActions and createCertificateManifest. Added a chikoOnPrintRef ref that gets assigned handlePrint via a useEffect. Called useChikoActions with a factory that creates the manifest passing the onPrintRef. This replaced the disabled comment that read "Register Chiko manifest — disabled (old CSS workspace, replaced by canvas workspace)."

### 6. diploma-designer/DiplomaDesignerWorkspace.tsx (Fix Manifest Wiring)

The Chiko registration was already present and importing from the diploma manifest. The fix was changing the manifest factory call from createDiplomaManifest({}) to createDiplomaManifest({ onPrintRef: chikoOnPrintRef }). The chikoOnPrintRef was already defined in the component and wired to handlePrint.

### 7. CertificateDesignerWorkspace.tsx — Canvas Version (Compile Fix)

Updated the Chiko registration section to use chikoOnPrintRef instead of the removed exportPngRef, exportPdfRef, and copyRef. The manifest factory now passes { onPrintRef: chikoOnPrintRef }. The export ref wiring was simplified from three refs to just chikoOnPrintRef.current = exportPNG. This file is no longer routed to but still needs to compile.

### 8. DiplomaCanvasWorkspace.tsx — Canvas Version (Compile Fix)

Same treatment as the canvas certificate workspace. Replaced three export refs with single chikoOnPrintRef. Updated manifest factory call. Updated export ref wiring. Also no longer routed to but must compile.

## Store Architecture Notes

### certificate-editor.ts Store

Uses temporal(persist(immer(...))) middleware stack. Persist key is "dmsuite-certificate". The state has a form object of type CertificateFormData with nested style (template, accentColor, borderStyle, fontPairing, fontScale, headerStyle) and format (pageSize, orientation, margins) sub-objects. Signatories are an array with id, name, title, and role fields. addSignatory returns a string ID. removeSignatory and updateSignatory take the signatory ID, not an index. There are 10 certificate types, 8 templates, and 8 font pairings.

### diploma-editor.ts Store

Same middleware stack. Persist key is "dmsuite-diploma-editor". The form uses programName (not degreeName). Has institutional fields, conferral text, resolution text, accreditation body and number. There are 8 diploma types, 10 templates, and 8 honors levels. addSignatory returns an ID string. removeSignatory and updateSignatory take ID.

## Important Difference: Signatory Handling

Both editor stores use ID-based signatory management (addSignatory returns ID, update/remove take ID). But Chiko's interface exposes index-based access for user friendliness (index 0, 1, 2). The manifests bridge this by looking up form.signatories[index] to get the signatory object, then passing sig.id to the store methods.

## Verification

TypeScript check ran clean: zero errors across the entire project, and specifically zero errors in any certificate, diploma, or chiko manifest file.

## Commits

Commit fe8695e: "fix(certificate,diploma): wire Pattern A workspaces to routing, adapters, and Chiko manifests" — 8 files changed, 429 insertions, 468 deletions.

Commit 5628b9f: "chore: update TOOL-STATUS.md and memory-bank for certificate/diploma architecture fix" — TOOL-STATUS.md changelog entry added, activeContext.md updated.

Both pushed to origin/main.

## What Still Exists But Is Now Disconnected

The Canvas2D pipeline files still exist in the codebase but are no longer routed to. They compile successfully but serve no active purpose:

- src/components/workspaces/CertificateDesignerWorkspace.tsx (canvas version, top-level)
- src/components/workspaces/DiplomaCanvasWorkspace.tsx
- src/stores/certificate-canvas.ts
- src/stores/diploma-canvas.ts
- src/lib/editor/certificate-library.ts (80 procedural assets)
- src/lib/editor/certificate-composer.ts
- src/lib/editor/diploma-composer.ts

These could be removed in a future cleanup session but were left in place to avoid breaking any remaining imports.

## What Might Need Attention in Future Sessions

The certificates/ folder at the project root contains external SVG template assets (vecteezy and other sources) that were never committed or integrated. The Pattern A CertificateRenderer.tsx already has inline SVG decorations within its 8 templates, which provides good visual quality. But if Drake wants to add more ornate SVG backgrounds or borders from that folder, that work remains undone.

The TOOL-CREATION-GUIDE.md was read in full (all 2220 lines, 30 sections) during this session. The guide defines Pattern A (Tab Editor plus HTML/CSS Preview plus Layers Panel) as the correct architecture for document tools like certificates and diplomas. Pattern C (Canvas-Based Layer Editor) is reserved for freeform visual editors like social media posts, posters, banners, and logos. This distinction was the root cause of the architecture mismatch.
