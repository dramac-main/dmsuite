# DMSuite Resume & CV Builder — Reactive Resume-Inspired Rebuild Plan

> **Goal:** Complete rewrite of the Resume & CV Builder workspace to match the polish, UX, and feature depth of [Reactive Resume](https://rxresu.me) — the #1 open-source resume builder with 30k+ GitHub stars.
>
> **Approach:** Keep the solid infrastructure (schema, store engine, templates, AI, exports, API routes) but completely rewrite the workspace UI/UX to match Reactive Resume's battle-tested editor pattern.

---

## Phase 1: Schema & Store Enhancements

### New Section Types (matching Reactive Resume)
- [x] **Profiles/Social** — Multiple social links (GitHub, LinkedIn, Twitter, Portfolio, etc.)
- [x] **Publications** — Academic papers, articles, blog posts
- [x] **Interests** — Hobbies, interests, passions

### New Features in Schema
- [x] **Profile Photo** — URL field in basics for photo upload/display
- [x] **Rich text** — Descriptions store HTML (bold, italic, links, lists)
- [x] **Section visibility** — Per-item hidden toggle (already exists)
- [x] **Custom CSS** — Already exists in metadata.css

### Store Enhancements
- [x] Keep temporal + persist + immer middleware stack
- [x] Add `updateProfile()` for social profiles CRUD
- [x] Add drag & drop reorder actions
- [x] Keep AI revision system and undo/redo

---

## Phase 2: Workspace UI Rewrite (Reactive Resume Style)

### Layout: Two-Panel Editor
```
┌─────────────────────────────────────────────────────────┐
│ Toolbar: [← Back] [Resume Name] [Undo/Redo] [Export ▼] │
├──────────────────────┬──────────────────────────────────┤
│ Left Panel (w-96)    │ Right Panel (Preview)            │
│                      │                                  │
│ ┌──────────────────┐ │  ┌────────────────────────────┐  │
│ │ Basics Section   │ │  │                            │  │
│ │ (name, headline, │ │  │   Real-Time A4 Preview     │  │
│ │  photo, socials) │ │  │   (zoom-scaled)            │  │
│ └──────────────────┘ │  │                            │  │
│                      │  │                            │  │
│ ┌──────────────────┐ │  │                            │  │
│ │ Summary          │ │  │                            │  │
│ │ (rich text)      │ │  │                            │  │
│ └──────────────────┘ │  │                            │  │
│                      │  └────────────────────────────┘  │
│ ┌──────────────────┐ │                                  │
│ │ Experience       │ │  Page Nav: [◀] [●●●] [▶]        │
│ │ (draggable items)│ │                                  │
│ └──────────────────┘ │  Template Strip: [T1][T2][T3]... │
│                      │                                  │
│ ┌──────────────────┐ │                                  │
│ │ Education        │ │                                  │
│ └──────────────────┘ │                                  │
│                      │                                  │
│ [+ Add Section]      │                                  │
│ [AI Generate ✨]     │                                  │
│ [Import Resume 📄]   │                                  │
│ [Design Settings ⚙]  │                                  │
├──────────────────────┴──────────────────────────────────┤
│ Mobile BottomBar: [Edit] [Preview] [Design] [Export]    │
└─────────────────────────────────────────────────────────┘
```

### Key UX Differences from Current Tool
1. **No wizard gate** — Users land directly in the editor (like Reactive Resume)
2. **All sections visible** — Scrollable left panel shows ALL sections (not hidden behind tabs)
3. **Collapsible sections** — Each section is an accordion (expand/collapse)
4. **Drag & drop** — Reorder sections AND items within sections
5. **Inline editing** — Edit content directly in left panel forms
6. **Quick AI generate** — Button to AI-generate entire resume from scratch
7. **Import button** — Upload existing resume (PDF/DOCX) to populate
8. **Design panel** — Slide-out or modal for template/style/format settings
9. **Profile photo** — Photo upload in basics section
10. **Social profiles** — Add multiple social links

### Sections in Left Panel (Reactive Resume Pattern)
1. **Basics** — Name, headline, email, phone, location, photo, website
2. **Profiles** — Social links (LinkedIn, GitHub, Twitter, etc.)
3. **Summary** — Professional summary (rich text)
4. **Experience** — Work history (draggable items)
5. **Education** — Academic history (draggable items)
6. **Skills** — Skill groups with keywords
7. **Languages** — Language proficiency
8. **Certifications** — Professional certifications
9. **Projects** — Notable projects
10. **Awards** — Awards & achievements
11. **Volunteer** — Volunteer experience
12. **Publications** — Academic publications
13. **Interests** — Hobbies & interests
14. **References** — Professional references
15. **Custom Sections** — User-created sections

---

## Phase 3: Template & Rendering

### Keep Existing
- 20 pro templates (template-defs.ts)
- UniversalTemplate.tsx with per-template CSS
- TemplateRenderer.tsx with pagination
- Google Fonts loading

### Enhancements
- [x] Profile photo rendering in templates
- [x] Social profiles rendering (with icons)
- [x] Publications section rendering
- [x] Interests section rendering
- [x] Better template picker gallery (visual grid with names)

---

## Phase 4: Export & AI

### Keep Existing (All Working)
- PDF export (jsPDF + html2canvas)
- DOCX export
- TXT export (ATS-friendly)
- JSON export/import
- Clipboard copy
- Print via browser

### Keep Existing AI Features
- AI Generation via Claude (api/chat/resume/generate)
- AI Revision engine
- ATS Scorer
- Diff preview system

### Enhancements
- [x] AI generate accessible from editor (no wizard required)
- [x] Updated Chiko manifest with new section types

---

## Phase 5: Chiko Integration

### Updated Manifest Actions
- All existing 24 actions stay
- New: `updatePhoto(url)` — Set profile photo
- New: `addProfile(network, username, url)` — Add social link
- New: `removeProfile(index)` — Remove social link
- New: `addPublication(...)` — Add publication
- New: `addInterest(...)` — Add interest
- New: Full awareness of all 15 section types

---

## File Changes Summary

### DELETE (Old Wizard Files)
- `src/components/workspaces/resume-cv/StepPersonal.tsx`
- `src/components/workspaces/resume-cv/StepTargetRole.tsx`
- `src/components/workspaces/resume-cv/StepExperience.tsx`
- `src/components/workspaces/resume-cv/StepEducationSkills.tsx`
- `src/components/workspaces/resume-cv/StepBrief.tsx`
- `src/components/workspaces/resume-cv/StepGeneration.tsx`
- `src/components/workspaces/resume-cv/StepUpload.tsx`
- `src/components/workspaces/resume-cv/WizardStepIndicator.tsx`
- `src/components/workspaces/resume-cv/editor/` (entire directory)
- `src/components/workspaces/resume-cv/tabs/` (entire directory)
- `src/components/workspaces/ResumeCVWorkspace.tsx` (legacy)
- `src/components/workspaces/ResumeCVWorkspaceV2.tsx` (current entry)
- `src/stores/resume-cv-wizard.ts` (wizard store)
- `src/stores/resume-editor-ui.ts` (wizard UI state)

### CREATE (New Files)
- `src/components/workspaces/resume-cv/ResumeBuilderWorkspace.tsx` — New main workspace
- `src/components/workspaces/resume-cv/ResumeLeftPanel.tsx` — Scrollable section editor
- `src/components/workspaces/resume-cv/ResumePreviewPanel.tsx` — Live A4 preview
- `src/components/workspaces/resume-cv/ResumeDesignDrawer.tsx` — Design settings drawer
- `src/components/workspaces/resume-cv/ResumeImportModal.tsx` — Import resume modal
- `src/components/workspaces/resume-cv/ResumeAIGenerateModal.tsx` — AI generation modal
- `src/components/workspaces/resume-cv/sections/BasicsSection.tsx` — Personal info + photo
- `src/components/workspaces/resume-cv/sections/ProfilesSection.tsx` — Social links
- `src/components/workspaces/resume-cv/sections/SummarySection.tsx` — Rich text summary
- `src/components/workspaces/resume-cv/sections/ExperienceSection.tsx` — Work history
- `src/components/workspaces/resume-cv/sections/EducationSection.tsx` — Education
- `src/components/workspaces/resume-cv/sections/SkillsSection.tsx` — Skills
- `src/components/workspaces/resume-cv/sections/GenericSection.tsx` — Reusable section component
- `src/components/workspaces/resume-cv/sections/SectionItem.tsx` — Draggable item wrapper
- `src/components/workspaces/resume-cv/shared/RichTextEditor.tsx` — Simple rich text (bold/italic/links)
- `src/components/workspaces/resume-cv/shared/DraggableList.tsx` — Drag-to-reorder wrapper
- `src/components/workspaces/resume-cv/shared/PhotoUpload.tsx` — Profile photo upload

### MODIFY (Existing Files)
- `src/lib/resume/schema.ts` — Add profiles, publications, interests sections
- `src/stores/resume-editor.ts` — Add photo, profiles, publications, interests actions
- `src/lib/chiko/manifests/resume.ts` — Add new section actions
- `src/lib/resume/templates/UniversalTemplate.tsx` — Render new sections
- `src/data/template-css.ts` — CSS for new section types
- `src/app/tools/[categoryId]/[toolId]/page.tsx` — Update dynamic import
- `src/data/tools.ts` — Update tool entry
- `src/lib/store-adapters.ts` — Ensure adapter works with new fields

---

## Implementation Order

1. **Schema enhancements** — Add new sections, photo field
2. **Store enhancements** — Add new actions
3. **Delete old files** — Remove wizard, old editor components
4. **Build new workspace** — ResumeBuilderWorkspace.tsx (main shell)
5. **Build left panel** — All section editors
6. **Build preview panel** — Live A4 preview with zoom/nav
7. **Build design drawer** — Template/style/format settings
8. **Build modals** — Import + AI Generate
9. **Update templates** — Render new sections
10. **Update Chiko manifest** — New actions
11. **Update routing** — Dynamic import
12. **Test everything** — TypeScript, build, visual check
13. **Commit & push**
