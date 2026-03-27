"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";

// ━━━ Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type BadgeType =
  | "corporate-employee"
  | "visitor-pass"
  | "conference-event"
  | "student-id"
  | "government-official"
  | "healthcare-staff"
  | "contractor-temp"
  | "vip-executive"
  | "membership"
  | "security-access"
  | "volunteer"
  | "intern";

export type BadgeTemplate =
  | "modern-corporate"
  | "gradient-flow"
  | "minimalist-clean"
  | "bold-accent"
  | "executive-premium"
  | "academic-classic"
  | "healthcare-pro"
  | "tech-modern"
  | "event-vibrant"
  | "government-formal";

export type CardSize = "cr80" | "cr79" | "cr100" | "custom";
export type PhotoShape = "square" | "rounded" | "circle" | "rounded-square";
export type BarcodeType = "code128" | "code39" | "qr" | "none";
export type PrintLayout = "single" | "2-up" | "4-up" | "8-up" | "10-up";
export type LayoutDensity = "compact" | "standard" | "spacious";
export type RoleVariant = "staff" | "manager" | "security" | "intern" | "contractor" | "visitor" | "vip" | "custom";

// ── Badge Type Configurations ───────────────────────────────────────────────

export interface BadgeTypeConfig {
  id: BadgeType;
  name: string;
  description: string;
  icon: string;
  defaultRole: RoleVariant;
}

export const BADGE_TYPES: BadgeTypeConfig[] = [
  { id: "corporate-employee", name: "Corporate Employee", description: "Professional staff badge with department and role", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", defaultRole: "staff" },
  { id: "visitor-pass", name: "Visitor Pass", description: "Temporary visitor access badge", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z", defaultRole: "visitor" },
  { id: "conference-event", name: "Conference / Event", description: "Event attendee or speaker badge", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", defaultRole: "staff" },
  { id: "student-id", name: "Student ID", description: "School or university student card", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", defaultRole: "staff" },
  { id: "government-official", name: "Government / Official", description: "Government agency or official ID", icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9", defaultRole: "staff" },
  { id: "healthcare-staff", name: "Healthcare Staff", description: "Hospital or clinic staff badge", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", defaultRole: "staff" },
  { id: "contractor-temp", name: "Contractor / Temporary", description: "Contractor or temporary access badge", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", defaultRole: "contractor" },
  { id: "vip-executive", name: "VIP / Executive", description: "Premium executive or VIP badge", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z", defaultRole: "vip" },
  { id: "membership", name: "Membership Card", description: "Club, gym, or organization membership", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", defaultRole: "staff" },
  { id: "security-access", name: "Security / Access", description: "Security clearance and access control badge", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", defaultRole: "security" },
  { id: "volunteer", name: "Volunteer", description: "Volunteer or community event badge", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", defaultRole: "staff" },
  { id: "intern", name: "Intern / Trainee", description: "Internship or training program badge", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", defaultRole: "intern" },
];

// ── Template Configurations ─────────────────────────────────────────────────

export interface BadgeTemplateConfig {
  id: BadgeTemplate;
  name: string;
  accent: string;
  headerBg: string;
  bodyBg: string;
  fontPairing: string;
  photoShape: PhotoShape;
}

export const BADGE_TEMPLATES: BadgeTemplateConfig[] = [
  { id: "modern-corporate", name: "Modern Corporate", accent: "#1e40af", headerBg: "#1e40af", bodyBg: "#ffffff", fontPairing: "inter-jetbrains", photoShape: "rounded-square" },
  { id: "gradient-flow", name: "Gradient Flow", accent: "#7c3aed", headerBg: "#7c3aed", bodyBg: "#ffffff", fontPairing: "poppins-inter", photoShape: "circle" },
  { id: "minimalist-clean", name: "Minimalist Clean", accent: "#18181b", headerBg: "#18181b", bodyBg: "#ffffff", fontPairing: "dm-serif-dm-sans", photoShape: "rounded-square" },
  { id: "bold-accent", name: "Bold Accent", accent: "#dc2626", headerBg: "#dc2626", bodyBg: "#ffffff", fontPairing: "oswald-roboto", photoShape: "square" },
  { id: "executive-premium", name: "Executive Premium", accent: "#b8860b", headerBg: "#1a1a2e", bodyBg: "#0f0f23", fontPairing: "playfair-lato", photoShape: "circle" },
  { id: "academic-classic", name: "Academic Classic", accent: "#1e3a5f", headerBg: "#1e3a5f", bodyBg: "#f9f5eb", fontPairing: "merriweather-opensans", photoShape: "rounded-square" },
  { id: "healthcare-pro", name: "Healthcare Pro", accent: "#0891b2", headerBg: "#0891b2", bodyBg: "#f0fdfa", fontPairing: "inter-jetbrains", photoShape: "circle" },
  { id: "tech-modern", name: "Tech Modern", accent: "#6366f1", headerBg: "#0f172a", bodyBg: "#ffffff", fontPairing: "poppins-inter", photoShape: "rounded-square" },
  { id: "event-vibrant", name: "Event Vibrant", accent: "#ea580c", headerBg: "#ea580c", bodyBg: "#ffffff", fontPairing: "oswald-roboto", photoShape: "circle" },
  { id: "government-formal", name: "Government Formal", accent: "#166534", headerBg: "#166534", bodyBg: "#ffffff", fontPairing: "crimson-source", photoShape: "square" },
];

// ── Font Pairings ───────────────────────────────────────────────────────────

export const BADGE_FONT_PAIRINGS: Record<string, { heading: string; body: string; google: string }> = {
  "inter-jetbrains": { heading: "Inter", body: "Inter", google: "Inter:wght@300;400;500;600;700;800" },
  "poppins-inter": { heading: "Poppins", body: "Inter", google: "Poppins:wght@400;500;600;700&family=Inter:wght@300;400;500;600" },
  "playfair-lato": { heading: "Playfair Display", body: "Lato", google: "Playfair+Display:wght@400;600;700;900&family=Lato:wght@300;400;700" },
  "merriweather-opensans": { heading: "Merriweather", body: "Open Sans", google: "Merriweather:wght@400;700;900&family=Open+Sans:wght@300;400;600;700" },
  "crimson-source": { heading: "Crimson Text", body: "Source Sans 3", google: "Crimson+Text:wght@400;600;700&family=Source+Sans+3:wght@300;400;600;700" },
  "oswald-roboto": { heading: "Oswald", body: "Roboto", google: "Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700" },
  "dm-serif-dm-sans": { heading: "DM Serif Display", body: "DM Sans", google: "DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700" },
  "cormorant-montserrat": { heading: "Cormorant Garamond", body: "Montserrat", google: "Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700" },
};

// ── Role Variant Colors ─────────────────────────────────────────────────────

export interface RoleConfig {
  id: RoleVariant;
  label: string;
  color: string;
  borderColor: string;
}

export const ROLE_VARIANTS: RoleConfig[] = [
  { id: "staff", label: "Staff", color: "#1e40af", borderColor: "#3b82f6" },
  { id: "manager", label: "Manager", color: "#7c3aed", borderColor: "#a78bfa" },
  { id: "security", label: "Security", color: "#dc2626", borderColor: "#f87171" },
  { id: "intern", label: "Intern", color: "#0891b2", borderColor: "#22d3ee" },
  { id: "contractor", label: "Contractor", color: "#ea580c", borderColor: "#fb923c" },
  { id: "visitor", label: "Visitor", color: "#ca8a04", borderColor: "#facc15" },
  { id: "vip", label: "VIP", color: "#b8860b", borderColor: "#fbbf24" },
  { id: "custom", label: "Custom", color: "#6b7280", borderColor: "#9ca3af" },
];

// ── Card Size Definitions ───────────────────────────────────────────────────

export interface CardSizeConfig {
  id: CardSize;
  name: string;
  label: string;
  widthIn: number;
  heightIn: number;
  widthMm: number;
  heightMm: number;
  description: string;
}

export const CARD_SIZES: CardSizeConfig[] = [
  { id: "cr80", name: "CR80", label: "CR80 (Standard)", widthIn: 3.375, heightIn: 2.125, widthMm: 85.6, heightMm: 54, description: "Standard credit-card size — most common ID badge format" },
  { id: "cr79", name: "CR79", label: "CR79 (Adhesive)", widthIn: 3.303, heightIn: 2.051, widthMm: 83.9, heightMm: 52.1, description: "Slightly smaller for adhesive-backed badges" },
  { id: "cr100", name: "CR100", label: "CR100 (Military/Gov)", widthIn: 3.88, heightIn: 2.63, widthMm: 98.5, heightMm: 67, description: "Larger format for government CAC and military IDs" },
  { id: "custom", name: "Custom", label: "Custom Size", widthIn: 3.375, heightIn: 2.125, widthMm: 85.6, heightMm: 54, description: "Custom dimensions" },
];

// ── Accent Color Swatches ───────────────────────────────────────────────────

export const BADGE_ACCENT_COLORS = [
  "#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7",
  "#4f46e5", "#059669", "#b8860b", "#18181b", "#166534", "#0891b2",
  "#6366f1", "#be185d", "#7e22ce", "#ca8a04",
];

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface Signatory {
  id: string;
  name: string;
  title: string;
}

export interface BatchPerson {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  employeeId: string;
  role: RoleVariant;
  photoUrl: string;
  email: string;
  phone: string;
  accessLevel: string;
  customField1: string;
  customField2: string;
}

export interface BackSideConfig {
  enabled: boolean;
  showQrCode: boolean;
  qrContent: "employee-id" | "vcard" | "url" | "custom";
  qrCustomValue: string;
  showBarcode: boolean;
  barcodeType: BarcodeType;
  barcodeContent: "employee-id" | "custom";
  barcodeCustomValue: string;
  showMagneticStripe: boolean;
  showNfcZone: boolean;
  showTermsText: boolean;
  termsText: string;
  showContactInfo: boolean;
  showEmergencyContact: boolean;
  emergencyPhone: string;
  showReturnAddress: boolean;
  returnAddress: string;
}

export interface SecurityFeatures {
  showHolographicZone: boolean;
  holographicPosition: "top-right" | "bottom-left" | "center" | "overlay";
  showWatermark: boolean;
  watermarkText: string;
  showMicrotextBorder: boolean;
  microtextContent: string;
  sequentialNumbering: boolean;
  sequentialStart: number;
  sequentialPrefix: string;
}

export interface LanyardConfig {
  showLanyard: boolean;
  lanyardColor: string;
  lanyardWidth: "narrow" | "standard" | "wide";
  showBreakawayClip: boolean;
  showBadgeHolder: boolean;
  holderType: "clear" | "frosted" | "colored";
  brandingText: string;
  brandingRepeat: boolean;
}

export interface BadgeStyleConfig {
  template: BadgeTemplate;
  accentColor: string;
  fontPairing: string;
  fontScale: number;
  photoShape: PhotoShape;
  layoutDensity: LayoutDensity;
  showRoleBadge: boolean;
  showDepartmentBadge: boolean;
  headerStyle: "solid" | "gradient" | "pattern" | "minimal";
}

export interface BadgeFormatConfig {
  cardSize: CardSize;
  customWidthMm: number;
  customHeightMm: number;
  orientation: "landscape" | "portrait";
  bleedMm: number;
  safeZoneMm: number;
  showCutMarks: boolean;
  showBleedArea: boolean;
  showSafeZone: boolean;
  printLayout: PrintLayout;
  printPageSize: "a4" | "letter";
  colorProfile: "rgb" | "cmyk-sim";
  dpi: 300 | 600;
}

export interface IDBadgeFormData {
  badgeType: BadgeType;

  // ── Front side content ──
  organizationName: string;
  organizationLogo: string;
  organizationSubtitle: string;

  // ── Person info (single badge mode) ──
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  employeeId: string;
  role: RoleVariant;
  photoUrl: string;
  email: string;
  phone: string;
  accessLevel: string;

  // ── Dates ──
  issueDate: string;
  expiryDate: string;

  // ── Custom fields ──
  customField1Label: string;
  customField1Value: string;
  customField2Label: string;
  customField2Value: string;

  // ── Authorized signatory ──
  signatory: Signatory;

  // ── Batch mode ──
  batchMode: boolean;
  batchPeople: BatchPerson[];

  // ── Back side ──
  backSide: BackSideConfig;

  // ── Security features ──
  security: SecurityFeatures;

  // ── Lanyard ──
  lanyard: LanyardConfig;

  // ── Style ──
  style: BadgeStyleConfig;

  // ── Format ──
  format: BadgeFormatConfig;
}

// ━━━ Defaults ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createDefaultBackSide(): BackSideConfig {
  return {
    enabled: true,
    showQrCode: true,
    qrContent: "employee-id",
    qrCustomValue: "",
    showBarcode: true,
    barcodeType: "code128",
    barcodeContent: "employee-id",
    barcodeCustomValue: "",
    showMagneticStripe: false,
    showNfcZone: false,
    showTermsText: true,
    termsText: "This card is the property of the issuing organization. If found, please return to the address below.",
    showContactInfo: true,
    showEmergencyContact: false,
    emergencyPhone: "",
    showReturnAddress: true,
    returnAddress: "",
  };
}

function createDefaultSecurity(): SecurityFeatures {
  return {
    showHolographicZone: false,
    holographicPosition: "top-right",
    showWatermark: false,
    watermarkText: "OFFICIAL",
    showMicrotextBorder: false,
    microtextContent: "AUTHENTIC • VERIFIED • OFFICIAL",
    sequentialNumbering: false,
    sequentialStart: 1,
    sequentialPrefix: "ID-",
  };
}

function createDefaultLanyard(): LanyardConfig {
  return {
    showLanyard: false,
    lanyardColor: "#1e40af",
    lanyardWidth: "standard",
    showBreakawayClip: true,
    showBadgeHolder: true,
    holderType: "clear",
    brandingText: "",
    brandingRepeat: true,
  };
}

function createDefaultStyle(): BadgeStyleConfig {
  return {
    template: "modern-corporate",
    accentColor: "#1e40af",
    fontPairing: "inter-jetbrains",
    fontScale: 1,
    photoShape: "rounded-square",
    layoutDensity: "standard",
    showRoleBadge: true,
    showDepartmentBadge: true,
    headerStyle: "solid",
  };
}

function createDefaultFormat(): BadgeFormatConfig {
  return {
    cardSize: "cr80",
    customWidthMm: 85.6,
    customHeightMm: 54,
    orientation: "landscape",
    bleedMm: 3,
    safeZoneMm: 5,
    showCutMarks: false,
    showBleedArea: false,
    showSafeZone: false,
    printLayout: "single",
    printPageSize: "a4",
    colorProfile: "rgb",
    dpi: 300,
  };
}

export function createDefaultBadgeForm(): IDBadgeFormData {
  return {
    badgeType: "corporate-employee",

    organizationName: "DMSuite Solutions",
    organizationLogo: "",
    organizationSubtitle: "Technology & Innovation",

    firstName: "John",
    lastName: "Mwamba",
    title: "Software Engineer",
    department: "Technology",
    employeeId: "EMP-20260001",
    role: "staff",
    photoUrl: "",
    email: "john.mwamba@dmsuite.com",
    phone: "+260 977 123 456",
    accessLevel: "Level 2",

    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),

    customField1Label: "",
    customField1Value: "",
    customField2Label: "",
    customField2Value: "",

    signatory: { id: "sig-1", name: "Jane Banda", title: "HR Director" },

    batchMode: false,
    batchPeople: [],

    backSide: createDefaultBackSide(),
    security: createDefaultSecurity(),
    lanyard: createDefaultLanyard(),
    style: createDefaultStyle(),
    format: createDefaultFormat(),
  };
}

function createDefaultBatchPerson(): BatchPerson {
  const id = `bp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    firstName: "",
    lastName: "",
    title: "",
    department: "",
    employeeId: "",
    role: "staff",
    photoUrl: "",
    email: "",
    phone: "",
    accessLevel: "",
    customField1: "",
    customField2: "",
  };
}

// ━━━ Store Interface ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface IDBadgeEditorState {
  form: IDBadgeFormData;
  accentColorLocked: boolean;

  // ── Actions ──
  setForm: (form: IDBadgeFormData) => void;
  resetForm: (badgeType?: BadgeType) => void;
  setBadgeType: (type: BadgeType) => void;
  setAccentColorLocked: (locked: boolean) => void;

  // Content
  updateContent: (patch: Partial<Pick<IDBadgeFormData, "firstName" | "lastName" | "title" | "department" | "employeeId" | "role" | "photoUrl" | "email" | "phone" | "accessLevel">>) => void;
  updateOrganization: (patch: Partial<Pick<IDBadgeFormData, "organizationName" | "organizationLogo" | "organizationSubtitle">>) => void;
  updateDates: (patch: Partial<Pick<IDBadgeFormData, "issueDate" | "expiryDate">>) => void;
  updateCustomFields: (patch: Partial<Pick<IDBadgeFormData, "customField1Label" | "customField1Value" | "customField2Label" | "customField2Value">>) => void;
  updateSignatory: (patch: Partial<Signatory>) => void;

  // Batch
  setBatchMode: (enabled: boolean) => void;
  addBatchPerson: () => string;
  updateBatchPerson: (id: string, patch: Partial<BatchPerson>) => void;
  removeBatchPerson: (id: string) => void;
  clearBatch: () => void;
  importBatchData: (people: Omit<BatchPerson, "id">[]) => void;

  // Back side
  updateBackSide: (patch: Partial<BackSideConfig>) => void;

  // Security
  updateSecurity: (patch: Partial<SecurityFeatures>) => void;

  // Lanyard
  updateLanyard: (patch: Partial<LanyardConfig>) => void;

  // Style
  updateStyle: (patch: Partial<BadgeStyleConfig>) => void;
  setTemplate: (template: BadgeTemplate) => void;
  setAccentColor: (color: string) => void;

  // Format
  updateFormat: (patch: Partial<BadgeFormatConfig>) => void;
}

// ━━━ Store ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const useIDBadgeEditor = create<IDBadgeEditorState>()(
  temporal(
    persist(
      immer<IDBadgeEditorState>((set) => ({
        form: createDefaultBadgeForm(),
        accentColorLocked: false,

        setForm: (form) =>
          set((state) => {
            state.form = form;
          }),

        resetForm: (badgeType) =>
          set((state) => {
            state.form = createDefaultBadgeForm();
            if (badgeType) {
              state.form.badgeType = badgeType;
              const bt = BADGE_TYPES.find((b) => b.id === badgeType);
              if (bt) state.form.role = bt.defaultRole;
            }
            state.accentColorLocked = false;
          }),

        setBadgeType: (type) =>
          set((state) => {
            state.form.badgeType = type;
            const bt = BADGE_TYPES.find((b) => b.id === type);
            if (bt) state.form.role = bt.defaultRole;
          }),

        setAccentColorLocked: (locked) =>
          set((state) => {
            state.accentColorLocked = locked;
          }),

        updateContent: (patch) =>
          set((state) => {
            Object.assign(state.form, patch);
          }),

        updateOrganization: (patch) =>
          set((state) => {
            Object.assign(state.form, patch);
          }),

        updateDates: (patch) =>
          set((state) => {
            Object.assign(state.form, patch);
          }),

        updateCustomFields: (patch) =>
          set((state) => {
            Object.assign(state.form, patch);
          }),

        updateSignatory: (patch) =>
          set((state) => {
            Object.assign(state.form.signatory, patch);
          }),

        setBatchMode: (enabled) =>
          set((state) => {
            state.form.batchMode = enabled;
          }),

        addBatchPerson: () => {
          let newId = "";
          set((state) => {
            const person = createDefaultBatchPerson();
            newId = person.id;
            state.form.batchPeople.push(person);
          });
          return newId;
        },

        updateBatchPerson: (id, patch) =>
          set((state) => {
            const person = state.form.batchPeople.find((p) => p.id === id);
            if (person) Object.assign(person, patch);
          }),

        removeBatchPerson: (id) =>
          set((state) => {
            state.form.batchPeople = state.form.batchPeople.filter((p) => p.id !== id);
          }),

        clearBatch: () =>
          set((state) => {
            state.form.batchPeople = [];
          }),

        importBatchData: (people) =>
          set((state) => {
            const imported: BatchPerson[] = people.map((p) => ({
              ...createDefaultBatchPerson(),
              ...p,
              id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            }));
            state.form.batchPeople = [...state.form.batchPeople, ...imported];
          }),

        updateBackSide: (patch) =>
          set((state) => {
            Object.assign(state.form.backSide, patch);
          }),

        updateSecurity: (patch) =>
          set((state) => {
            Object.assign(state.form.security, patch);
          }),

        updateLanyard: (patch) =>
          set((state) => {
            Object.assign(state.form.lanyard, patch);
          }),

        updateStyle: (patch) =>
          set((state) => {
            Object.assign(state.form.style, patch);
            if (patch.accentColor) {
              state.accentColorLocked = true;
            }
          }),

        setTemplate: (template) =>
          set((state) => {
            state.form.style.template = template;
            const tmpl = BADGE_TEMPLATES.find((t) => t.id === template);
            if (tmpl) {
              if (!state.accentColorLocked) {
                state.form.style.accentColor = tmpl.accent;
              }
              state.form.style.photoShape = tmpl.photoShape;
              state.form.style.fontPairing = tmpl.fontPairing;
              state.form.lanyard.lanyardColor = state.form.style.accentColor;
            }
          }),

        setAccentColor: (color) =>
          set((state) => {
            state.form.style.accentColor = color;
            state.accentColorLocked = true;
            state.form.lanyard.lanyardColor = color;
          }),

        updateFormat: (patch) =>
          set((state) => {
            Object.assign(state.form.format, patch);
          }),
      })),
      {
        name: "dmsuite-id-badge",
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ form: s.form, accentColorLocked: s.accentColorLocked }),
      }
    ),
    {
      limit: 50,
      partialize: (s) => ({ form: s.form }),
    }
  )
);

// ━━━ Temporal Hook ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useIDBadgeUndo() {
  const { undo, redo, pastStates, futureStates } = useIDBadgeEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
