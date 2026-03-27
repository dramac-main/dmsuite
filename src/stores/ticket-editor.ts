// =============================================================================
// DMSuite — Ticket & Pass Designer Editor Store
// Zustand + Immer + Zundo (temporal) for undo/redo of ticket/pass config.
// Supports 12 ticket types, 10 templates, 8 font pairings, 7 standard sizes.
// =============================================================================

"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import equal from "fast-deep-equal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TicketType =
  | "event"
  | "concert"
  | "movie"
  | "sports"
  | "boarding-pass"
  | "transit"
  | "vip"
  | "festival"
  | "raffle"
  | "parking"
  | "admission"
  | "conference";

export const TICKET_TYPES: { id: TicketType; label: string; defaultTitle: string; description: string }[] = [
  { id: "event", label: "Event Ticket", defaultTitle: "General Event Ticket", description: "Conferences, galas, exhibitions, meetups" },
  { id: "concert", label: "Concert Ticket", defaultTitle: "Concert Ticket", description: "Live music, tours, performances" },
  { id: "movie", label: "Movie Ticket", defaultTitle: "Cinema Ticket", description: "Film screenings, premieres, festivals" },
  { id: "sports", label: "Sports Ticket", defaultTitle: "Sports Event Ticket", description: "Games, matches, tournaments" },
  { id: "boarding-pass", label: "Boarding Pass", defaultTitle: "Boarding Pass", description: "Airline boarding passes, IATA-style" },
  { id: "transit", label: "Transit Pass", defaultTitle: "Transit Pass", description: "Bus, train, metro, ferry passes" },
  { id: "vip", label: "VIP Pass", defaultTitle: "VIP Access Pass", description: "All-access, backstage, VIP zones" },
  { id: "festival", label: "Festival Pass", defaultTitle: "Festival Pass", description: "Multi-day festivals, camping, wristbands" },
  { id: "raffle", label: "Raffle Ticket", defaultTitle: "Raffle Ticket", description: "Draws, lotteries, prize entries" },
  { id: "parking", label: "Parking Pass", defaultTitle: "Parking Permit", description: "Vehicle parking permits and passes" },
  { id: "admission", label: "Admission Ticket", defaultTitle: "Admission Ticket", description: "Museums, zoos, parks, attractions" },
  { id: "conference", label: "Conference Badge", defaultTitle: "Conference Badge", description: "Workshops, seminars, corporate events" },
];

export type TicketTemplate =
  | "classic-elegant"
  | "modern-minimal"
  | "bold-vibrant"
  | "dark-premium"
  | "retro-vintage"
  | "corporate-clean"
  | "festival-neon"
  | "sports-dynamic"
  | "airline-standard"
  | "cinema-classic";

export interface TicketTemplateConfig {
  id: TicketTemplate;
  name: string;
  accent: string;
  bgColor: string;
  textColor: string;
  fontPairing: string;
}

export const TICKET_TEMPLATES: TicketTemplateConfig[] = [
  { id: "classic-elegant", name: "Classic Elegant", accent: "#b8860b", bgColor: "#faf6ef", textColor: "#1a1a1a", fontPairing: "playfair-lato" },
  { id: "modern-minimal", name: "Modern Minimal", accent: "#3b82f6", bgColor: "#ffffff", textColor: "#111827", fontPairing: "inter-inter" },
  { id: "bold-vibrant", name: "Bold Vibrant", accent: "#ef4444", bgColor: "#fef2f2", textColor: "#1a1a1a", fontPairing: "poppins-inter" },
  { id: "dark-premium", name: "Dark Premium", accent: "#a78bfa", bgColor: "#0f0f0f", textColor: "#f9fafb", fontPairing: "dm-serif-dm-sans" },
  { id: "retro-vintage", name: "Retro Vintage", accent: "#92400e", bgColor: "#faf3e3", textColor: "#1c1917", fontPairing: "playfair-lato" },
  { id: "corporate-clean", name: "Corporate Clean", accent: "#1e40af", bgColor: "#ffffff", textColor: "#111827", fontPairing: "inter-inter" },
  { id: "festival-neon", name: "Festival Neon", accent: "#22d3ee", bgColor: "#0a0a0a", textColor: "#f9fafb", fontPairing: "oswald-roboto" },
  { id: "sports-dynamic", name: "Sports Dynamic", accent: "#ea580c", bgColor: "#ffffff", textColor: "#0f172a", fontPairing: "oswald-roboto" },
  { id: "airline-standard", name: "Airline Standard", accent: "#0369a1", bgColor: "#ffffff", textColor: "#0f172a", fontPairing: "inter-inter" },
  { id: "cinema-classic", name: "Cinema Classic", accent: "#dc2626", bgColor: "#1a1a1a", textColor: "#f9fafb", fontPairing: "dm-serif-dm-sans" },
];

export type TicketSize =
  | "standard"
  | "small"
  | "large"
  | "boarding"
  | "wristband"
  | "a4-sheet"
  | "custom";

export const TICKET_SIZES: { id: TicketSize; label: string; description: string; w: number; h: number }[] = [
  { id: "standard", label: "Standard (8.5×3.5\")", description: "216 × 89 mm — Most common event ticket", w: 816, h: 336 },
  { id: "small", label: "Small (5.5×2\")", description: "140 × 51 mm — Raffle/stub tickets", w: 528, h: 192 },
  { id: "large", label: "Large (8.5×4\")", description: "216 × 102 mm — Concert/VIP tickets", w: 816, h: 384 },
  { id: "boarding", label: "Boarding (8×3.375\")", description: "203 × 86 mm — IATA boarding pass", w: 768, h: 324 },
  { id: "wristband", label: "Wristband (10×1\")", description: "254 × 25 mm — Festival wristband", w: 960, h: 96 },
  { id: "a4-sheet", label: "A4 Sheet (3-up)", description: "3 tickets per A4 page for batch print", w: 794, h: 1123 },
  { id: "custom", label: "Custom Size", description: "Set your own dimensions", w: 816, h: 336 },
];

export type BarcodeType = "qr" | "code128" | "none";

export type PerforationStyle = "dashed" | "dotted" | "none";

export interface TicketEventInfo {
  eventName: string;
  eventSubtitle: string;
  venueName: string;
  venueAddress: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  doors: string;
}

export interface TicketSeatInfo {
  section: string;
  row: string;
  seat: string;
  gate: string;
  zone: string;
  floor: string;
}

export interface TicketAttendeeInfo {
  attendeeName: string;
  attendeeEmail: string;
  ticketClass: string;
  ageGroup: string;
}

export interface TicketBarcodeConfig {
  type: BarcodeType;
  value: string;
  showValue: boolean;
}

export interface TicketStubConfig {
  enabled: boolean;
  perforation: PerforationStyle;
  duplicateInfo: boolean;
}

export interface TicketSerialConfig {
  enabled: boolean;
  prefix: string;
  startNumber: number;
  padLength: number;
}

export interface TicketBoardingInfo {
  airline: string;
  flightNumber: string;
  departureCity: string;
  departureCode: string;
  arrivalCity: string;
  arrivalCode: string;
  boardingTime: string;
  departureTime: string;
  travelClass: string;
  boardingGroup: string;
  passengerName: string;
  seatNumber: string;
}

export interface TicketStyleConfig {
  template: TicketTemplate;
  accentColor: string;
  bgColor: string;
  textColor: string;
  fontPairing: string;
  fontScale: number;
  headerStyle: "centered" | "left-aligned" | "split";
  showLogo: boolean;
  logoText: string;
  showBackground: boolean;
  backgroundGradient: boolean;
  gradientDirection: "to-right" | "to-bottom" | "to-br" | "to-bl";
}

export interface TicketFormatConfig {
  ticketSize: TicketSize;
  orientation: "landscape" | "portrait";
  customWidth: number;
  customHeight: number;
  margins: "none" | "narrow" | "standard";
  bleed: boolean;
  cropMarks: boolean;
  ticketsPerPage: number;
}

export interface TicketFormData {
  ticketType: TicketType;

  // Event info
  event: TicketEventInfo;

  // Seating
  seat: TicketSeatInfo;

  // Attendee
  attendee: TicketAttendeeInfo;

  // Boarding pass specific
  boarding: TicketBoardingInfo;

  // Barcode / QR
  barcode: TicketBarcodeConfig;

  // Stub
  stub: TicketStubConfig;

  // Serial numbering
  serial: TicketSerialConfig;

  // Terms / conditions
  terms: string;

  // Organizer
  organizerName: string;
  organizerContact: string;
  organizerWebsite: string;

  // Price
  price: string;
  currency: string;

  // Style
  style: TicketStyleConfig;

  // Format
  format: TicketFormatConfig;
}

// ---------------------------------------------------------------------------
// Font Pairings
// ---------------------------------------------------------------------------

export const TICKET_FONT_PAIRINGS: Record<string, { heading: string; body: string; google: string }> = {
  "playfair-lato": {
    heading: "Playfair Display",
    body: "Lato",
    google: "Playfair+Display:wght@400;600;700;900&family=Lato:wght@300;400;700",
  },
  "inter-inter": {
    heading: "Inter",
    body: "Inter",
    google: "Inter:wght@300;400;500;600;700;800",
  },
  "poppins-inter": {
    heading: "Poppins",
    body: "Inter",
    google: "Poppins:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600",
  },
  "oswald-roboto": {
    heading: "Oswald",
    body: "Roboto",
    google: "Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700",
  },
  "dm-serif-dm-sans": {
    heading: "DM Serif Display",
    body: "DM Sans",
    google: "DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700",
  },
  "merriweather-opensans": {
    heading: "Merriweather",
    body: "Open Sans",
    google: "Merriweather:wght@400;700;900&family=Open+Sans:wght@300;400;600;700",
  },
  "cormorant-montserrat": {
    heading: "Cormorant Garamond",
    body: "Montserrat",
    google: "Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600",
  },
  "crimson-source": {
    heading: "Crimson Text",
    body: "Source Sans 3",
    google: "Crimson+Text:wght@400;600;700&family=Source+Sans+3:wght@300;400;600;700",
  },
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createDefaultTicketForm(type?: TicketType): TicketFormData {
  const ticketType = type ?? "event";
  const typeConfig = TICKET_TYPES.find((t) => t.id === ticketType) ?? TICKET_TYPES[0];

  const isBoardingPass = ticketType === "boarding-pass";
  const isRaffle = ticketType === "raffle";
  const isFestival = ticketType === "festival";
  const isWristband = isFestival;

  return {
    ticketType,

    event: {
      eventName: typeConfig.defaultTitle,
      eventSubtitle: "",
      venueName: "",
      venueAddress: "",
      date: new Date().toISOString().split("T")[0],
      time: "19:00",
      endDate: "",
      endTime: "",
      doors: "",
    },

    seat: {
      section: "",
      row: "",
      seat: "",
      gate: "",
      zone: "",
      floor: "",
    },

    attendee: {
      attendeeName: "",
      attendeeEmail: "",
      ticketClass: ticketType === "vip" ? "VIP" : "General Admission",
      ageGroup: "Adult",
    },

    boarding: {
      airline: "",
      flightNumber: "",
      departureCity: "",
      departureCode: "",
      arrivalCity: "",
      arrivalCode: "",
      boardingTime: "",
      departureTime: "",
      travelClass: "Economy",
      boardingGroup: "",
      passengerName: "",
      seatNumber: "",
    },

    barcode: {
      type: isBoardingPass ? "qr" : isRaffle ? "code128" : "qr",
      value: `TICKET-${uid().toUpperCase()}`,
      showValue: true,
    },

    stub: {
      enabled: isRaffle || ticketType === "event",
      perforation: "dashed",
      duplicateInfo: true,
    },

    serial: {
      enabled: isRaffle,
      prefix: "TKT",
      startNumber: 1,
      padLength: 5,
    },

    terms: "",

    organizerName: "",
    organizerContact: "",
    organizerWebsite: "",

    price: "",
    currency: "USD",

    style: {
      template: isBoardingPass ? "airline-standard" : ticketType === "movie" ? "cinema-classic" : "modern-minimal",
      accentColor: isBoardingPass ? "#0369a1" : "#3b82f6",
      bgColor: "#ffffff",
      textColor: "#111827",
      fontPairing: "inter-inter",
      fontScale: 1,
      headerStyle: "left-aligned",
      showLogo: true,
      logoText: "",
      showBackground: false,
      backgroundGradient: false,
      gradientDirection: "to-right",
    },

    format: {
      ticketSize: isBoardingPass ? "boarding" : isWristband ? "wristband" : isRaffle ? "small" : "standard",
      orientation: "landscape",
      customWidth: 816,
      customHeight: 336,
      margins: "narrow",
      bleed: false,
      cropMarks: false,
      ticketsPerPage: 1,
    },
  };
}

export function getTicketTemplate(id: string): TicketTemplateConfig {
  return TICKET_TEMPLATES.find((t) => t.id === id) ?? TICKET_TEMPLATES[1];
}

export function getTicketSize(id: string): { w: number; h: number } {
  const size = TICKET_SIZES.find((s) => s.id === id);
  return size ? { w: size.w, h: size.h } : { w: 816, h: 336 };
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

export interface TicketEditorState {
  form: TicketFormData;
  accentColorLocked: boolean;

  // Top-level
  setForm: (form: TicketFormData) => void;
  resetForm: (ticketType?: TicketType) => void;
  setTicketType: (type: TicketType) => void;

  // Accent color lock
  setAccentColorLocked: (locked: boolean) => void;

  // Event
  updateEvent: (patch: Partial<TicketEventInfo>) => void;

  // Seating
  updateSeat: (patch: Partial<TicketSeatInfo>) => void;

  // Attendee
  updateAttendee: (patch: Partial<TicketAttendeeInfo>) => void;

  // Boarding
  updateBoarding: (patch: Partial<TicketBoardingInfo>) => void;

  // Barcode
  updateBarcode: (patch: Partial<TicketBarcodeConfig>) => void;

  // Stub
  updateStub: (patch: Partial<TicketStubConfig>) => void;

  // Serial
  updateSerial: (patch: Partial<TicketSerialConfig>) => void;

  // Organizer / misc
  updateOrganizer: (patch: Partial<Pick<TicketFormData, "organizerName" | "organizerContact" | "organizerWebsite" | "terms" | "price" | "currency">>) => void;

  // Style
  updateStyle: (patch: Partial<TicketStyleConfig>) => void;
  setTemplate: (template: TicketTemplate) => void;
  setAccentColor: (color: string) => void;

  // Format
  updateFormat: (patch: Partial<TicketFormatConfig>) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTicketEditor = create<TicketEditorState>()(
  temporal(
    persist(
      immer<TicketEditorState>((set) => ({
        form: createDefaultTicketForm(),
        accentColorLocked: false,

        setAccentColorLocked: (locked) =>
          set((s) => {
            s.accentColorLocked = locked;
          }),

        setTicketType: (type) =>
          set((s) => {
            const typeConfig = TICKET_TYPES.find((t) => t.id === type);
            s.form.ticketType = type;
            if (typeConfig) {
              s.form.event.eventName = typeConfig.defaultTitle;
            }
            // Auto-configure size based on type
            if (type === "boarding-pass") s.form.format.ticketSize = "boarding";
            else if (type === "festival") s.form.format.ticketSize = "wristband";
            else if (type === "raffle") s.form.format.ticketSize = "small";
            else if (s.form.format.ticketSize === "boarding" || s.form.format.ticketSize === "wristband") {
              s.form.format.ticketSize = "standard";
            }
            // Auto-configure barcode
            if (type === "raffle") s.form.barcode.type = "code128";
            else if (type === "boarding-pass") s.form.barcode.type = "qr";
            // Auto-configure stub
            s.form.stub.enabled = type === "raffle" || type === "event";
            // Auto-configure serial
            s.form.serial.enabled = type === "raffle";
          }),

        setForm: (form) =>
          set((s) => {
            s.form = form;
          }),

        resetForm: (ticketType) =>
          set((s) => {
            s.form = createDefaultTicketForm(ticketType ?? s.form.ticketType);
            s.accentColorLocked = false;
          }),

        updateEvent: (patch) =>
          set((s) => {
            Object.assign(s.form.event, patch);
          }),

        updateSeat: (patch) =>
          set((s) => {
            Object.assign(s.form.seat, patch);
          }),

        updateAttendee: (patch) =>
          set((s) => {
            Object.assign(s.form.attendee, patch);
          }),

        updateBoarding: (patch) =>
          set((s) => {
            Object.assign(s.form.boarding, patch);
          }),

        updateBarcode: (patch) =>
          set((s) => {
            Object.assign(s.form.barcode, patch);
          }),

        updateStub: (patch) =>
          set((s) => {
            Object.assign(s.form.stub, patch);
          }),

        updateSerial: (patch) =>
          set((s) => {
            Object.assign(s.form.serial, patch);
          }),

        updateOrganizer: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        updateStyle: (patch) =>
          set((s) => {
            if (patch.accentColor) s.accentColorLocked = true;
            if (patch.template && !s.accentColorLocked) {
              const tpl = getTicketTemplate(patch.template);
              patch.accentColor = tpl.accent;
              patch.bgColor = tpl.bgColor;
              patch.textColor = tpl.textColor;
            }
            Object.assign(s.form.style, patch);
          }),

        setTemplate: (template) =>
          set((s) => {
            s.form.style.template = template;
            if (!s.accentColorLocked) {
              const tpl = getTicketTemplate(template);
              s.form.style.accentColor = tpl.accent;
              s.form.style.bgColor = tpl.bgColor;
              s.form.style.textColor = tpl.textColor;
              s.form.style.fontPairing = tpl.fontPairing;
            }
          }),

        setAccentColor: (color) =>
          set((s) => {
            s.form.style.accentColor = color;
            s.accentColorLocked = true;
          }),

        updateFormat: (patch) =>
          set((s) => {
            Object.assign(s.form.format, patch);
          }),
      })),
      {
        name: "dmsuite-ticket-designer",
        version: 1,
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ form: s.form, accentColorLocked: s.accentColorLocked }),
      },
    ),
    {
      partialize: (state) => ({ form: state.form }),
      equality: (a, b) => equal(a, b),
      limit: 50,
    },
  ),
);

// ---------------------------------------------------------------------------
// Undo hook
// ---------------------------------------------------------------------------

export function useTicketUndo() {
  const { undo, redo, pastStates, futureStates } =
    useTicketEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
