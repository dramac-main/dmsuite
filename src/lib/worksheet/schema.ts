// =============================================================================
// DMSuite — Worksheet & Form Designer Schema
// Types, defaults, templates, document types, and element definitions.
// =============================================================================

// Re-export shared types from invoice schema
export { FONT_PAIRINGS, ACCENT_COLORS, PAGE_FORMATS, PAGE_DIMENSIONS } from "@/lib/invoice/schema";
export type { FontPairingId, PageFormat } from "@/lib/invoice/schema";

// ---------------------------------------------------------------------------
// Document Types
// ---------------------------------------------------------------------------

export const DOCUMENT_TYPES = [
  "educational-worksheet",
  "business-form",
  "survey-feedback",
  "checklist",
  "registration-form",
  "hr-employment",
  "medical-health",
  "legal-consent",
  "inspection-form",
  "order-form",
  "event-registration",
  "client-onboarding",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface DocumentTypeConfig {
  id: DocumentType;
  label: string;
  shortLabel: string;
  description: string;
  icon: string; // SVG path
  defaultSections: string[];
  supportsAnswerKey: boolean;
}

export const DOCUMENT_TYPE_CONFIGS: Record<DocumentType, DocumentTypeConfig> = {
  "educational-worksheet": {
    id: "educational-worksheet",
    label: "Educational Worksheet",
    shortLabel: "Worksheet",
    description: "Math, literacy, science, and language worksheets with answer keys",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    defaultSections: ["header", "instructions", "questions", "word-bank"],
    supportsAnswerKey: true,
  },
  "business-form": {
    id: "business-form",
    label: "Business Intake Form",
    shortLabel: "Business",
    description: "Client intake, project briefs, and business data collection forms",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    defaultSections: ["header", "contact-info", "project-details"],
    supportsAnswerKey: false,
  },
  "survey-feedback": {
    id: "survey-feedback",
    label: "Survey & Feedback Form",
    shortLabel: "Survey",
    description: "Customer satisfaction, employee feedback, and research surveys",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    defaultSections: ["header", "instructions", "rating-section", "comments"],
    supportsAnswerKey: false,
  },
  "checklist": {
    id: "checklist",
    label: "Checklist",
    shortLabel: "Checklist",
    description: "Task lists, inspection checklists, and verification forms",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    defaultSections: ["header", "checklist-items"],
    supportsAnswerKey: false,
  },
  "registration-form": {
    id: "registration-form",
    label: "Registration Form",
    shortLabel: "Registration",
    description: "Event, course, membership, and program registration forms",
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    defaultSections: ["header", "personal-info", "registration-details"],
    supportsAnswerKey: false,
  },
  "hr-employment": {
    id: "hr-employment",
    label: "HR & Employment Form",
    shortLabel: "HR",
    description: "Employee evaluations, leave requests, and HR documentation",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    defaultSections: ["header", "employee-info", "evaluation-section"],
    supportsAnswerKey: false,
  },
  "medical-health": {
    id: "medical-health",
    label: "Medical & Health Form",
    shortLabel: "Medical",
    description: "Patient intake, health history, and medical consent forms",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    defaultSections: ["header", "patient-info", "medical-history", "consent"],
    supportsAnswerKey: false,
  },
  "legal-consent": {
    id: "legal-consent",
    label: "Legal & Consent Form",
    shortLabel: "Legal",
    description: "Waivers, disclaimers, consent forms, and authorization documents",
    icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
    defaultSections: ["header", "terms", "consent-declaration", "signature"],
    supportsAnswerKey: false,
  },
  "inspection-form": {
    id: "inspection-form",
    label: "Inspection & Audit Form",
    shortLabel: "Inspection",
    description: "Safety inspections, quality audits, and compliance checklists",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    defaultSections: ["header", "inspection-details", "checklist-items", "findings"],
    supportsAnswerKey: false,
  },
  "order-form": {
    id: "order-form",
    label: "Order Form",
    shortLabel: "Order",
    description: "Product orders, service requests, and purchase forms",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
    defaultSections: ["header", "customer-info", "order-items", "totals"],
    supportsAnswerKey: false,
  },
  "event-registration": {
    id: "event-registration",
    label: "Event Registration Form",
    shortLabel: "Event",
    description: "Conference, workshop, seminar, and event sign-up forms",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    defaultSections: ["header", "attendee-info", "event-options", "payment-info"],
    supportsAnswerKey: false,
  },
  "client-onboarding": {
    id: "client-onboarding",
    label: "Client Onboarding Form",
    shortLabel: "Onboarding",
    description: "New client setup, preferences, and information gathering",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    defaultSections: ["header", "business-info", "service-preferences", "agreement"],
    supportsAnswerKey: false,
  },
};

// ---------------------------------------------------------------------------
// Educational Subject Types
// ---------------------------------------------------------------------------

export const EDUCATIONAL_SUBJECTS = [
  "math",
  "literacy",
  "science",
  "language",
  "social-studies",
  "geography",
  "history",
  "art",
  "general",
] as const;

export type EducationalSubject = (typeof EDUCATIONAL_SUBJECTS)[number];

export const EDUCATIONAL_SUBJECT_LABELS: Record<EducationalSubject, string> = {
  math: "Mathematics",
  literacy: "Literacy & Reading",
  science: "Science",
  language: "Language Arts",
  "social-studies": "Social Studies",
  geography: "Geography",
  history: "History",
  art: "Art & Design",
  general: "General",
};

export const GRADE_LEVELS = [
  "pre-k",
  "kindergarten",
  "grade-1",
  "grade-2",
  "grade-3",
  "grade-4",
  "grade-5",
  "grade-6",
  "grade-7",
  "grade-8",
  "grade-9",
  "grade-10",
  "grade-11",
  "grade-12",
  "college",
  "adult",
] as const;

export type GradeLevel = (typeof GRADE_LEVELS)[number];

export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  "pre-k": "Pre-K",
  kindergarten: "Kindergarten",
  "grade-1": "Grade 1",
  "grade-2": "Grade 2",
  "grade-3": "Grade 3",
  "grade-4": "Grade 4",
  "grade-5": "Grade 5",
  "grade-6": "Grade 6",
  "grade-7": "Grade 7",
  "grade-8": "Grade 8",
  "grade-9": "Grade 9",
  "grade-10": "Grade 10",
  "grade-11": "Grade 11",
  "grade-12": "Grade 12",
  college: "College / University",
  adult: "Adult Education",
};

// ---------------------------------------------------------------------------
// Form Element Types
// ---------------------------------------------------------------------------

export const ELEMENT_TYPES = [
  "text-field",
  "textarea",
  "checkbox",
  "radio-group",
  "dropdown",
  "date-field",
  "number-field",
  "signature-block",
  "rating-scale",
  "likert-scale",
  "table",
  "heading",
  "paragraph",
  "divider",
  "spacer",
  "image-placeholder",
  // Educational-specific
  "fill-in-blank",
  "multiple-choice",
  "matching-columns",
  "word-bank",
  "numbered-list",
  "lined-writing",
  "math-grid",
  "diagram-label",
  "true-false",
  "short-answer",
  "reading-passage",
] as const;

export type ElementType = (typeof ELEMENT_TYPES)[number];

export interface ElementTypeConfig {
  id: ElementType;
  label: string;
  category: "input" | "choice" | "scale" | "layout" | "educational" | "special";
  icon: string; // SVG path
  description: string;
}

export const ELEMENT_TYPE_CONFIGS: Record<ElementType, ElementTypeConfig> = {
  "text-field": {
    id: "text-field",
    label: "Text Field",
    category: "input",
    icon: "M4 6h16M4 12h16M4 18h7",
    description: "Single-line text input with label",
  },
  textarea: {
    id: "textarea",
    label: "Text Area",
    category: "input",
    icon: "M4 6h16M4 10h16M4 14h16M4 18h10",
    description: "Multi-line text input for longer responses",
  },
  checkbox: {
    id: "checkbox",
    label: "Checkbox",
    category: "choice",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    description: "Yes/No or multi-select checkboxes",
  },
  "radio-group": {
    id: "radio-group",
    label: "Radio Group",
    category: "choice",
    icon: "M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
    description: "Single-select radio button group",
  },
  dropdown: {
    id: "dropdown",
    label: "Dropdown",
    category: "choice",
    icon: "M8 9l4-4 4 4m0 6l-4 4-4-4",
    description: "Dropdown select field with options",
  },
  "date-field": {
    id: "date-field",
    label: "Date Field",
    category: "input",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    description: "Date input with calendar formatting",
  },
  "number-field": {
    id: "number-field",
    label: "Number Field",
    category: "input",
    icon: "M7 20l4-16m2 16l4-16M6 9h14M4 15h14",
    description: "Numeric input field",
  },
  "signature-block": {
    id: "signature-block",
    label: "Signature Block",
    category: "special",
    icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
    description: "Signature line with name, title, and date",
  },
  "rating-scale": {
    id: "rating-scale",
    label: "Rating Scale",
    category: "scale",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    description: "Numeric rating (e.g. 1-5 stars or 1-10)",
  },
  "likert-scale": {
    id: "likert-scale",
    label: "Likert Scale",
    category: "scale",
    icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
    description: "Agreement scale (Strongly Disagree → Strongly Agree)",
  },
  table: {
    id: "table",
    label: "Table",
    category: "layout",
    icon: "M3 10h18M3 14h18M10 3v18M14 3v18",
    description: "Data table with configurable rows and columns",
  },
  heading: {
    id: "heading",
    label: "Section Heading",
    category: "layout",
    icon: "M4 6h16M4 12h8",
    description: "Section title or heading text",
  },
  paragraph: {
    id: "paragraph",
    label: "Paragraph Text",
    category: "layout",
    icon: "M4 6h16M4 10h16M4 14h16M4 18h12",
    description: "Descriptive text, instructions, or notes",
  },
  divider: {
    id: "divider",
    label: "Divider Line",
    category: "layout",
    icon: "M3 12h18",
    description: "Horizontal separator line",
  },
  spacer: {
    id: "spacer",
    label: "Spacer",
    category: "layout",
    icon: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5",
    description: "Empty space between elements",
  },
  "image-placeholder": {
    id: "image-placeholder",
    label: "Image Placeholder",
    category: "layout",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    description: "Placeholder for images or diagrams",
  },
  "fill-in-blank": {
    id: "fill-in-blank",
    label: "Fill in the Blank",
    category: "educational",
    icon: "M4 6h16M4 12h4m4 0h4M4 18h16",
    description: "Sentence with blanks for students to complete",
  },
  "multiple-choice": {
    id: "multiple-choice",
    label: "Multiple Choice",
    category: "educational",
    icon: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    description: "Question with lettered answer options (A, B, C, D)",
  },
  "matching-columns": {
    id: "matching-columns",
    label: "Matching Columns",
    category: "educational",
    icon: "M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01",
    description: "Two columns to match items (draw lines or write letters)",
  },
  "word-bank": {
    id: "word-bank",
    label: "Word Bank",
    category: "educational",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    description: "Collection of words for students to use in exercises",
  },
  "numbered-list": {
    id: "numbered-list",
    label: "Numbered List",
    category: "educational",
    icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
    description: "Numbered question or task list",
  },
  "lined-writing": {
    id: "lined-writing",
    label: "Lined Writing Space",
    category: "educational",
    icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
    description: "Lined area for handwriting (adjustable line spacing)",
  },
  "math-grid": {
    id: "math-grid",
    label: "Math Grid",
    category: "educational",
    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z",
    description: "Grid for math calculations, graphs, or coordinate work",
  },
  "diagram-label": {
    id: "diagram-label",
    label: "Diagram Labeling",
    category: "educational",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    description: "Placeholder area with numbered labels for diagram identification",
  },
  "true-false": {
    id: "true-false",
    label: "True / False",
    category: "educational",
    icon: "M5 13l4 4L19 7",
    description: "Statement with True/False selection",
  },
  "short-answer": {
    id: "short-answer",
    label: "Short Answer",
    category: "educational",
    icon: "M4 6h16M4 12h16M4 18h7",
    description: "Question with short lined answer space",
  },
  "reading-passage": {
    id: "reading-passage",
    label: "Reading Passage",
    category: "educational",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    description: "Text passage followed by comprehension questions",
  },
};

// Group element types by category
export const ELEMENT_CATEGORIES = [
  { key: "input" as const, label: "Input Fields", description: "Text, number, and date inputs" },
  { key: "choice" as const, label: "Choice Fields", description: "Checkboxes, radio buttons, dropdowns" },
  { key: "scale" as const, label: "Rating & Scales", description: "Rating scales and Likert scales" },
  { key: "educational" as const, label: "Educational", description: "Worksheets, quizzes, and exercises" },
  { key: "layout" as const, label: "Layout", description: "Headings, text, dividers, and spacing" },
  { key: "special" as const, label: "Special", description: "Signatures, images, and more" },
] as const;

// ---------------------------------------------------------------------------
// Form Element Data
// ---------------------------------------------------------------------------

export interface FormElementOption {
  id: string;
  label: string;
  isCorrect?: boolean; // For answer keys
}

export interface TableColumn {
  id: string;
  header: string;
  width?: number; // percentage
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface LikertStatement {
  id: string;
  text: string;
}

export interface FormElement {
  id: string;
  type: ElementType;
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;

  // Input-specific
  maxLength?: number;
  lineCount?: number; // for textarea / lined-writing

  // Choice options (radio, checkbox, dropdown, multiple-choice)
  options?: FormElementOption[];

  // Rating scale
  ratingMin?: number;
  ratingMax?: number;
  ratingLabels?: { min: string; max: string };

  // Likert
  likertStatements?: LikertStatement[];
  likertLabels?: string[]; // e.g. ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]

  // Table
  tableColumns?: TableColumn[];
  tableRows?: number;
  tableData?: string[][]; // pre-filled data

  // Matching columns
  matchingPairs?: MatchingPair[];

  // Word bank
  words?: string[];

  // Fill-in-blank
  sentence?: string; // use ____ for blanks
  answers?: string[]; // correct answers for blanks

  // Math grid
  gridRows?: number;
  gridCols?: number;
  gridType?: "blank" | "numbered" | "coordinate";

  // Diagram label
  diagramLabels?: string[];
  diagramImageCaption?: string;

  // Reading passage
  passageText?: string;
  passageTitle?: string;

  // Heading / paragraph
  content?: string;
  headingLevel?: 1 | 2 | 3;

  // Spacer
  spacerHeight?: number; // in px

  // Numbered list
  items?: string[];

  // Short answer
  answerLines?: number;

  // True/False
  statement?: string;
  correctAnswer?: boolean;

  // Signature block
  signatureFields?: Array<{ id: string; role: string; showDate: boolean }>;

  // Points value (for educational grading)
  points?: number;

  // Answer key content
  answerKeyContent?: string;
}

// ---------------------------------------------------------------------------
// Form Section
// ---------------------------------------------------------------------------

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  elements: FormElement[];
  visible: boolean;
  collapsible?: boolean;
  columns?: 1 | 2; // Layout columns
}

// ---------------------------------------------------------------------------
// Style & Template
// ---------------------------------------------------------------------------

export const WORKSHEET_TEMPLATES = [
  {
    id: "modern-clean",
    name: "Modern Clean",
    accent: "#1e40af",
    headerStyle: "banner" as const,
    description: "Clean lines, blue accents, professional look",
  },
  {
    id: "educational-primary",
    name: "Primary Education",
    accent: "#059669",
    headerStyle: "playful" as const,
    description: "Friendly, colorful design for younger students",
  },
  {
    id: "corporate-formal",
    name: "Corporate Formal",
    accent: "#0f172a",
    headerStyle: "minimal" as const,
    description: "Professional business forms with clean typography",
  },
  {
    id: "medical-clinical",
    name: "Medical Clinical",
    accent: "#0e7490",
    headerStyle: "underline" as const,
    description: "Clinical and clean for medical/health forms",
  },
  {
    id: "legal-traditional",
    name: "Legal Traditional",
    accent: "#1f2937",
    headerStyle: "border" as const,
    description: "Traditional legal document styling",
  },
  {
    id: "vibrant-bold",
    name: "Vibrant Bold",
    accent: "#7c3aed",
    headerStyle: "banner" as const,
    description: "Bold colors and strong visual hierarchy",
  },
  {
    id: "soft-pastel",
    name: "Soft Pastel",
    accent: "#6366f1",
    headerStyle: "boxed" as const,
    description: "Gentle pastels for approachable forms",
  },
  {
    id: "dark-professional",
    name: "Dark Professional",
    accent: "#475569",
    headerStyle: "underline" as const,
    description: "Sophisticated dark accents for premium feel",
  },
] as const;

export type WorksheetTemplateId = (typeof WORKSHEET_TEMPLATES)[number]["id"];

export type HeaderStyle = "banner" | "underline" | "minimal" | "border" | "boxed" | "playful";

// ---------------------------------------------------------------------------
// Style Config
// ---------------------------------------------------------------------------

export interface WorksheetStyleConfig {
  template: WorksheetTemplateId;
  accentColor: string;
  fontPairing: string;
  headerStyle: HeaderStyle;
  showLogo: boolean;
  showFormNumber: boolean;
  showDate: boolean;
  showPageNumbers: boolean;
  showInstructions: boolean;
  numberedElements: boolean;
  showPointValues: boolean; // For educational
  showBorders: boolean;
  alternateRowShading: boolean;
  compactMode: boolean;
}

// ---------------------------------------------------------------------------
// Print / Format Config
// ---------------------------------------------------------------------------

export interface WorksheetPrintConfig {
  pageSize: "a4" | "letter" | "legal" | "a5";
  margins: "narrow" | "standard" | "wide";
  sectionSpacing: number; // 0-4 scale
  lineSpacing: "tight" | "normal" | "loose";
  fieldSize: "compact" | "standard" | "large"; // Size of input fields for handwriting
}

// ---------------------------------------------------------------------------
// Answer Key Config
// ---------------------------------------------------------------------------

export interface AnswerKeyConfig {
  enabled: boolean;
  showPoints: boolean;
  showExplanations: boolean;
  headerText: string;
}

// ---------------------------------------------------------------------------
// Branding / Header
// ---------------------------------------------------------------------------

export interface WorksheetBranding {
  organization: string;
  subtitle: string;
  logoUrl?: string;
  formNumber: string;
  date: string;
  confidentiality?: string;
  contactInfo?: string;
}

// ---------------------------------------------------------------------------
// Main Form Data
// ---------------------------------------------------------------------------

export interface WorksheetFormData {
  // Document metadata
  documentType: DocumentType;
  title: string;
  instructions: string;

  // Educational-specific
  subject?: EducationalSubject;
  gradeLevel?: GradeLevel;
  studentNameField: boolean;
  dateField: boolean;
  scoreField: boolean;

  // Branding
  branding: WorksheetBranding;

  // Sections & elements
  sections: FormSection[];

  // Style
  style: WorksheetStyleConfig;

  // Print
  printConfig: WorksheetPrintConfig;

  // Answer key
  answerKey: AnswerKeyConfig;
}

// ---------------------------------------------------------------------------
// Default Factory
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createDefaultElement(type: ElementType, labelOverride?: string): FormElement {
  const config = ELEMENT_TYPE_CONFIGS[type];
  const base: FormElement = {
    id: uid(),
    type,
    label: labelOverride ?? config.label,
    required: false,
  };

  switch (type) {
    case "text-field":
      return { ...base, placeholder: "Enter text..." };
    case "textarea":
      return { ...base, lineCount: 4, placeholder: "Enter details..." };
    case "checkbox":
      return {
        ...base,
        options: [
          { id: uid(), label: "Option 1" },
          { id: uid(), label: "Option 2" },
          { id: uid(), label: "Option 3" },
        ],
      };
    case "radio-group":
      return {
        ...base,
        options: [
          { id: uid(), label: "Option A" },
          { id: uid(), label: "Option B" },
          { id: uid(), label: "Option C" },
        ],
      };
    case "dropdown":
      return {
        ...base,
        options: [
          { id: uid(), label: "Select an option" },
          { id: uid(), label: "Option 1" },
          { id: uid(), label: "Option 2" },
        ],
      };
    case "date-field":
      return { ...base, placeholder: "DD / MM / YYYY" };
    case "number-field":
      return { ...base, placeholder: "0" };
    case "signature-block":
      return {
        ...base,
        signatureFields: [
          { id: uid(), role: "Signatory", showDate: true },
        ],
      };
    case "rating-scale":
      return {
        ...base,
        ratingMin: 1,
        ratingMax: 5,
        ratingLabels: { min: "Poor", max: "Excellent" },
      };
    case "likert-scale":
      return {
        ...base,
        likertStatements: [
          { id: uid(), text: "The service met my expectations" },
          { id: uid(), text: "I would recommend this to others" },
          { id: uid(), text: "The process was straightforward" },
        ],
        likertLabels: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
      };
    case "table":
      return {
        ...base,
        tableColumns: [
          { id: uid(), header: "Column 1", width: 33 },
          { id: uid(), header: "Column 2", width: 33 },
          { id: uid(), header: "Column 3", width: 34 },
        ],
        tableRows: 5,
      };
    case "heading":
      return { ...base, content: "Section Title", headingLevel: 2 };
    case "paragraph":
      return { ...base, content: "Enter descriptive text, instructions, or notes here." };
    case "divider":
      return base;
    case "spacer":
      return { ...base, spacerHeight: 20 };
    case "image-placeholder":
      return { ...base, diagramImageCaption: "Image or diagram" };
    case "fill-in-blank":
      return {
        ...base,
        sentence: "The capital of Zambia is ____.",
        answers: ["Lusaka"],
        points: 1,
      };
    case "multiple-choice":
      return {
        ...base,
        label: "What is 2 + 2?",
        options: [
          { id: uid(), label: "3", isCorrect: false },
          { id: uid(), label: "4", isCorrect: true },
          { id: uid(), label: "5", isCorrect: false },
          { id: uid(), label: "6", isCorrect: false },
        ],
        points: 1,
      };
    case "matching-columns":
      return {
        ...base,
        matchingPairs: [
          { id: uid(), left: "Item A", right: "Match 1" },
          { id: uid(), left: "Item B", right: "Match 2" },
          { id: uid(), left: "Item C", right: "Match 3" },
        ],
        points: 3,
      };
    case "word-bank":
      return {
        ...base,
        words: ["word1", "word2", "word3", "word4", "word5"],
      };
    case "numbered-list":
      return {
        ...base,
        items: ["First item", "Second item", "Third item"],
      };
    case "lined-writing":
      return { ...base, lineCount: 8 };
    case "math-grid":
      return {
        ...base,
        gridRows: 10,
        gridCols: 10,
        gridType: "blank",
      };
    case "diagram-label":
      return {
        ...base,
        diagramLabels: ["Label 1", "Label 2", "Label 3", "Label 4"],
        diagramImageCaption: "Diagram to label",
        points: 4,
      };
    case "true-false":
      return {
        ...base,
        statement: "The Earth revolves around the Sun.",
        correctAnswer: true,
        points: 1,
      };
    case "short-answer":
      return {
        ...base,
        label: "Explain your reasoning:",
        answerLines: 3,
        points: 2,
      };
    case "reading-passage":
      return {
        ...base,
        passageTitle: "The Importance of Water",
        passageText: "Water is essential for all forms of life on Earth. It covers about 71% of the Earth's surface and is vital for the survival of all living organisms. Clean water is necessary for drinking, agriculture, and maintaining healthy ecosystems.",
      };
    default:
      return base;
  }
}

export function createDefaultSections(docType: DocumentType): FormSection[] {
  switch (docType) {
    case "educational-worksheet":
      return [
        {
          id: uid(),
          title: "Reading & Comprehension",
          visible: true,
          elements: [
            createDefaultElement("reading-passage"),
            createDefaultElement("multiple-choice", "What is the main idea of the passage?"),
            createDefaultElement("short-answer", "In your own words, summarize the passage."),
            createDefaultElement("true-false"),
          ],
        },
        {
          id: uid(),
          title: "Fill in the Blanks",
          visible: true,
          elements: [
            createDefaultElement("word-bank"),
            createDefaultElement("fill-in-blank"),
            createDefaultElement("fill-in-blank", "Complete the sentence"),
          ],
        },
        {
          id: uid(),
          title: "Written Response",
          visible: true,
          elements: [
            createDefaultElement("short-answer", "Write a short paragraph about what you learned."),
            createDefaultElement("lined-writing"),
          ],
        },
      ];

    case "business-form":
      return [
        {
          id: uid(),
          title: "Contact Information",
          visible: true,
          columns: 2,
          elements: [
            createDefaultElement("text-field", "Full Name"),
            createDefaultElement("text-field", "Email Address"),
            createDefaultElement("text-field", "Phone Number"),
            createDefaultElement("text-field", "Company Name"),
            createDefaultElement("text-field", "Job Title"),
            createDefaultElement("text-field", "Address"),
          ],
        },
        {
          id: uid(),
          title: "Project Details",
          visible: true,
          elements: [
            createDefaultElement("dropdown", "Project Type"),
            createDefaultElement("textarea", "Project Description"),
            createDefaultElement("date-field", "Desired Start Date"),
            createDefaultElement("textarea", "Additional Requirements"),
          ],
        },
      ];

    case "survey-feedback":
      return [
        {
          id: uid(),
          title: "Overall Satisfaction",
          visible: true,
          elements: [
            createDefaultElement("rating-scale", "Overall Experience"),
            createDefaultElement("rating-scale", "Quality of Service"),
            createDefaultElement("rating-scale", "Value for Money"),
          ],
        },
        {
          id: uid(),
          title: "Detailed Feedback",
          visible: true,
          elements: [
            createDefaultElement("likert-scale"),
            createDefaultElement("textarea", "What did you enjoy most?"),
            createDefaultElement("textarea", "What could we improve?"),
          ],
        },
      ];

    case "checklist":
      return [
        {
          id: uid(),
          title: "Checklist Items",
          visible: true,
          elements: [
            createDefaultElement("checkbox", "Task 1 — Description of first task"),
            createDefaultElement("checkbox", "Task 2 — Description of second task"),
            createDefaultElement("checkbox", "Task 3 — Description of third task"),
            createDefaultElement("checkbox", "Task 4 — Description of fourth task"),
            createDefaultElement("checkbox", "Task 5 — Description of fifth task"),
          ],
        },
        {
          id: uid(),
          title: "Notes & Sign-Off",
          visible: true,
          elements: [
            createDefaultElement("textarea", "Notes / Comments"),
            createDefaultElement("signature-block"),
          ],
        },
      ];

    case "registration-form":
      return [
        {
          id: uid(),
          title: "Personal Information",
          visible: true,
          columns: 2,
          elements: [
            createDefaultElement("text-field", "First Name"),
            createDefaultElement("text-field", "Last Name"),
            createDefaultElement("text-field", "Email"),
            createDefaultElement("text-field", "Phone"),
            createDefaultElement("date-field", "Date of Birth"),
            createDefaultElement("dropdown", "Gender"),
          ],
        },
        {
          id: uid(),
          title: "Registration Details",
          visible: true,
          elements: [
            createDefaultElement("radio-group", "Membership Type"),
            createDefaultElement("checkbox", "Areas of Interest"),
            createDefaultElement("textarea", "Special Requirements"),
          ],
        },
        {
          id: uid(),
          title: "Agreement",
          visible: true,
          elements: [
            createDefaultElement("paragraph"),
            createDefaultElement("checkbox", "I agree to the terms and conditions"),
            createDefaultElement("signature-block"),
          ],
        },
      ];

    case "hr-employment":
      return [
        {
          id: uid(),
          title: "Employee Information",
          visible: true,
          columns: 2,
          elements: [
            createDefaultElement("text-field", "Full Name"),
            createDefaultElement("text-field", "Employee ID"),
            createDefaultElement("text-field", "Department"),
            createDefaultElement("text-field", "Position / Title"),
            createDefaultElement("date-field", "Date of Hire"),
            createDefaultElement("text-field", "Supervisor Name"),
          ],
        },
        {
          id: uid(),
          title: "Performance Assessment",
          visible: true,
          elements: [
            createDefaultElement("rating-scale", "Job Knowledge"),
            createDefaultElement("rating-scale", "Quality of Work"),
            createDefaultElement("rating-scale", "Communication"),
            createDefaultElement("rating-scale", "Teamwork"),
            createDefaultElement("rating-scale", "Initiative"),
          ],
        },
        {
          id: uid(),
          title: "Development Goals",
          visible: true,
          elements: [
            createDefaultElement("textarea", "Key Strengths"),
            createDefaultElement("textarea", "Areas for Improvement"),
            createDefaultElement("textarea", "Training Needs"),
          ],
        },
        {
          id: uid(),
          title: "Summary & Signatures",
          visible: true,
          elements: [
            createDefaultElement("dropdown", "Overall Rating"),
            createDefaultElement("textarea", "Manager Comments"),
            createDefaultElement("signature-block"),
          ],
        },
      ];

    case "medical-health":
      return [
        {
          id: uid(),
          title: "Patient Information",
          visible: true,
          columns: 2,
          elements: [
            createDefaultElement("text-field", "Full Name"),
            createDefaultElement("date-field", "Date of Birth"),
            createDefaultElement("text-field", "Phone Number"),
            createDefaultElement("text-field", "Emergency Contact"),
            createDefaultElement("text-field", "Insurance Provider"),
            createDefaultElement("text-field", "Policy Number"),
          ],
        },
        {
          id: uid(),
          title: "Medical History",
          visible: true,
          elements: [
            createDefaultElement("checkbox", "Current Conditions"),
            createDefaultElement("textarea", "Current Medications"),
            createDefaultElement("textarea", "Allergies"),
            createDefaultElement("radio-group", "Do you smoke?"),
          ],
        },
        {
          id: uid(),
          title: "Consent",
          visible: true,
          elements: [
            createDefaultElement("paragraph"),
            createDefaultElement("checkbox", "I consent to treatment"),
            createDefaultElement("signature-block"),
            createDefaultElement("date-field", "Date"),
          ],
        },
      ];

    case "legal-consent":
      return [
        {
          id: uid(),
          title: "Parties",
          visible: true,
          columns: 2,
          elements: [
            createDefaultElement("text-field", "Full Legal Name"),
            createDefaultElement("text-field", "Address"),
            createDefaultElement("date-field", "Date"),
            createDefaultElement("text-field", "ID / Passport Number"),
          ],
        },
        {
          id: uid(),
          title: "Terms & Conditions",
          visible: true,
          elements: [
            createDefaultElement("paragraph"),
            createDefaultElement("checkbox", "I acknowledge and agree to the above terms"),
          ],
        },
        {
          id: uid(),
          title: "Signatures",
          visible: true,
          elements: [
            createDefaultElement("signature-block"),
          ],
        },
      ];

    case "inspection-form":
      return [
        {
          id: uid(),
          title: "Inspection Details",
          visible: true,
          columns: 2,
          elements: [
            createDefaultElement("text-field", "Inspector Name"),
            createDefaultElement("date-field", "Inspection Date"),
            createDefaultElement("text-field", "Location / Site"),
            createDefaultElement("text-field", "Reference Number"),
          ],
        },
        {
          id: uid(),
          title: "Inspection Checklist",
          visible: true,
          elements: [
            createDefaultElement("table", "Inspection Items"),
            createDefaultElement("likert-scale"),
          ],
        },
        {
          id: uid(),
          title: "Findings & Actions",
          visible: true,
          elements: [
            createDefaultElement("textarea", "Findings"),
            createDefaultElement("textarea", "Corrective Actions Required"),
            createDefaultElement("signature-block"),
          ],
        },
      ];

    case "order-form":
      return [
        {
          id: uid(),
          title: "Customer Information",
          visible: true,
          columns: 2,
          elements: [
            createDefaultElement("text-field", "Customer Name"),
            createDefaultElement("text-field", "Company"),
            createDefaultElement("text-field", "Email"),
            createDefaultElement("text-field", "Phone"),
            createDefaultElement("text-field", "Shipping Address"),
            createDefaultElement("date-field", "Order Date"),
          ],
        },
        {
          id: uid(),
          title: "Order Items",
          visible: true,
          elements: [
            createDefaultElement("table", "Items"),
          ],
        },
        {
          id: uid(),
          title: "Payment & Authorization",
          visible: true,
          elements: [
            createDefaultElement("radio-group", "Payment Method"),
            createDefaultElement("textarea", "Special Instructions"),
            createDefaultElement("signature-block"),
          ],
        },
      ];

    case "event-registration":
      return [
        {
          id: uid(),
          title: "Attendee Information",
          visible: true,
          columns: 2,
          elements: [
            createDefaultElement("text-field", "Full Name"),
            createDefaultElement("text-field", "Email"),
            createDefaultElement("text-field", "Phone"),
            createDefaultElement("text-field", "Organization"),
          ],
        },
        {
          id: uid(),
          title: "Event Preferences",
          visible: true,
          elements: [
            createDefaultElement("radio-group", "Registration Type"),
            createDefaultElement("checkbox", "Sessions / Workshops"),
            createDefaultElement("radio-group", "Dietary Requirements"),
            createDefaultElement("textarea", "Accessibility Needs"),
          ],
        },
      ];

    case "client-onboarding":
      return [
        {
          id: uid(),
          title: "Business Information",
          visible: true,
          columns: 2,
          elements: [
            createDefaultElement("text-field", "Business Name"),
            createDefaultElement("text-field", "Industry"),
            createDefaultElement("text-field", "Website"),
            createDefaultElement("text-field", "Primary Contact"),
            createDefaultElement("text-field", "Email"),
            createDefaultElement("text-field", "Phone"),
          ],
        },
        {
          id: uid(),
          title: "Service Preferences",
          visible: true,
          elements: [
            createDefaultElement("checkbox", "Services Required"),
            createDefaultElement("radio-group", "Budget Range"),
            createDefaultElement("textarea", "Goals & Objectives"),
            createDefaultElement("textarea", "Current Challenges"),
          ],
        },
        {
          id: uid(),
          title: "Agreement",
          visible: true,
          elements: [
            createDefaultElement("paragraph"),
            createDefaultElement("checkbox", "I agree to the terms of service"),
            createDefaultElement("signature-block"),
          ],
        },
      ];

    default:
      return [
        {
          id: uid(),
          title: "Section 1",
          visible: true,
          elements: [
            createDefaultElement("text-field", "Field 1"),
            createDefaultElement("text-field", "Field 2"),
          ],
        },
      ];
  }
}

export function createDefaultWorksheetForm(): WorksheetFormData {
  return {
    documentType: "business-form",
    title: "Client Intake Form",
    instructions: "Please complete all required fields accurately.",

    subject: undefined,
    gradeLevel: undefined,
    studentNameField: true,
    dateField: true,
    scoreField: false,

    branding: {
      organization: "",
      subtitle: "",
      formNumber: "",
      date: new Date().toISOString().slice(0, 10),
      confidentiality: "",
      contactInfo: "",
    },

    sections: createDefaultSections("business-form"),

    style: {
      template: "modern-clean",
      accentColor: "#1e40af",
      fontPairing: "inter-inter",
      headerStyle: "banner",
      showLogo: false,
      showFormNumber: true,
      showDate: true,
      showPageNumbers: true,
      showInstructions: true,
      numberedElements: true,
      showPointValues: false,
      showBorders: true,
      alternateRowShading: true,
      compactMode: false,
    },

    printConfig: {
      pageSize: "a4",
      margins: "standard",
      sectionSpacing: 2,
      lineSpacing: "normal",
      fieldSize: "standard",
    },

    answerKey: {
      enabled: false,
      showPoints: true,
      showExplanations: false,
      headerText: "ANSWER KEY",
    },
  };
}

// Helpers
export { createDefaultElement, uid };
