// =============================================================================
// DMSuite — Ticket & Pass Designer Action Manifest for Chiko
// Gives Chiko AI full control over the Ticket & Pass Designer:
// event info, seating, attendee, boarding pass, barcode, stub, serial,
// style, format, and print settings.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useTicketEditor } from "@/stores/ticket-editor";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";
import type {
  TicketFormData,
  TicketType,
  TicketTemplate,
  TicketStyleConfig,
  TicketFormatConfig,
} from "@/stores/ticket-editor";

// ---------------------------------------------------------------------------
// Manifest Options
// ---------------------------------------------------------------------------

export interface TicketDesignerManifestOptions {
  onPrintRef?: React.RefObject<(() => void) | null>;
}

// ---------------------------------------------------------------------------
// Read state helpers
// ---------------------------------------------------------------------------

function readTicketState(): Record<string, unknown> {
  const { form } = useTicketEditor.getState();
  return {
    ticketType: form.ticketType,
    eventName: form.event.eventName,
    eventSubtitle: form.event.eventSubtitle,
    venueName: form.event.venueName,
    venueAddress: form.event.venueAddress,
    date: form.event.date,
    time: form.event.time,
    endDate: form.event.endDate,
    endTime: form.event.endTime,
    doors: form.event.doors,
    seat: { ...form.seat },
    attendee: { ...form.attendee },
    boarding: { ...form.boarding },
    barcode: { ...form.barcode },
    stub: { ...form.stub },
    serial: { ...form.serial },
    terms: form.terms,
    organizerName: form.organizerName,
    organizerContact: form.organizerContact,
    price: form.price,
    currency: form.currency,
    style: { ...form.style },
    format: { ...form.format },
  };
}

// ---------------------------------------------------------------------------
// Pre-print validation
// ---------------------------------------------------------------------------

interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
}

function validateTicket(): { issues: ValidationIssue[]; ready: boolean } {
  const { form } = useTicketEditor.getState();
  const issues: ValidationIssue[] = [];

  if (!form.event.eventName || form.event.eventName.trim().length === 0) {
    issues.push({ severity: "error", field: "eventName", message: "Event name is empty" });
  }
  if (!form.event.date) {
    issues.push({ severity: "warning", field: "date", message: "No event date set" });
  }
  if (form.ticketType === "boarding-pass") {
    if (!form.boarding.flightNumber) {
      issues.push({ severity: "warning", field: "flightNumber", message: "Flight number is not set" });
    }
    if (!form.boarding.departureCode || !form.boarding.arrivalCode) {
      issues.push({ severity: "warning", field: "route", message: "Departure or arrival code is missing" });
    }
    if (!form.boarding.passengerName && !form.attendee.attendeeName) {
      issues.push({ severity: "warning", field: "passengerName", message: "Passenger name is not set" });
    }
  }
  if (form.barcode.type !== "none" && !form.barcode.value) {
    issues.push({ severity: "warning", field: "barcodeValue", message: "Barcode value is empty" });
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  return { issues, ready: errorCount === 0 };
}

// ---------------------------------------------------------------------------
// Manifest Factory
// ---------------------------------------------------------------------------

export function createTicketDesignerManifest(options?: TicketDesignerManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "ticket-designer",
    toolName: "Ticket & Pass Designer",
    actions: [
      // ── Ticket Type ──
      {
        name: "setTicketType",
        description:
          "Change the ticket type. Options: event, concert, movie, sports, boarding-pass, transit, vip, festival, raffle, parking, admission, conference. Automatically adjusts size, barcode, and stub settings.",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["event", "concert", "movie", "sports", "boarding-pass", "transit", "vip", "festival", "raffle", "parking", "admission", "conference"],
              description: "Ticket type to switch to",
            },
          },
          required: ["type"],
        },
        category: "Content",
      },

      // ── Event Info ──
      {
        name: "updateEvent",
        description: "Update event details: eventName, eventSubtitle, venueName, venueAddress, date (YYYY-MM-DD), time (HH:MM), endDate, endTime, doors.",
        parameters: {
          type: "object",
          properties: {
            eventName: { type: "string", description: "Event/show name" },
            eventSubtitle: { type: "string", description: "Subtitle or tagline" },
            venueName: { type: "string", description: "Venue name" },
            venueAddress: { type: "string", description: "Venue address" },
            date: { type: "string", description: "Event date (YYYY-MM-DD)" },
            time: { type: "string", description: "Event time (HH:MM)" },
            endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
            endTime: { type: "string", description: "End time (HH:MM)" },
            doors: { type: "string", description: "Doors open time (HH:MM)" },
          },
        },
        category: "Content",
      },

      // ── Seating ──
      {
        name: "updateSeat",
        description: "Update seating: section, row, seat, gate, zone, floor.",
        parameters: {
          type: "object",
          properties: {
            section: { type: "string" },
            row: { type: "string" },
            seat: { type: "string" },
            gate: { type: "string" },
            zone: { type: "string" },
            floor: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── Attendee ──
      {
        name: "updateAttendee",
        description: "Update attendee: attendeeName, attendeeEmail, ticketClass, ageGroup.",
        parameters: {
          type: "object",
          properties: {
            attendeeName: { type: "string", description: "Attendee full name" },
            attendeeEmail: { type: "string", description: "Attendee email" },
            ticketClass: { type: "string", description: "Ticket class (e.g. VIP, General Admission)" },
            ageGroup: { type: "string", enum: ["Adult", "Child", "Senior", "Student"] },
          },
        },
        category: "Details",
      },

      // ── Boarding Pass ──
      {
        name: "updateBoarding",
        description: "Update boarding pass fields: airline, flightNumber, departureCity, departureCode (3-letter), arrivalCity, arrivalCode (3-letter), boardingTime, departureTime, travelClass, boardingGroup, passengerName, seatNumber.",
        parameters: {
          type: "object",
          properties: {
            airline: { type: "string" },
            flightNumber: { type: "string" },
            departureCity: { type: "string" },
            departureCode: { type: "string", description: "3-letter IATA code" },
            arrivalCity: { type: "string" },
            arrivalCode: { type: "string", description: "3-letter IATA code" },
            boardingTime: { type: "string" },
            departureTime: { type: "string" },
            travelClass: { type: "string", enum: ["Economy", "Premium Economy", "Business", "First Class"] },
            boardingGroup: { type: "string" },
            passengerName: { type: "string" },
            seatNumber: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── Barcode / QR ──
      {
        name: "updateBarcode",
        description: "Configure barcode: type (qr, code128, none), value, showValue.",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["qr", "code128", "none"] },
            value: { type: "string", description: "Barcode data / ticket ID" },
            showValue: { type: "boolean", description: "Show text below barcode" },
          },
        },
        category: "Details",
      },

      // ── Stub ──
      {
        name: "updateStub",
        description: "Configure tear-off stub: enabled, perforation (dashed, dotted, none), duplicateInfo.",
        parameters: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            perforation: { type: "string", enum: ["dashed", "dotted", "none"] },
            duplicateInfo: { type: "boolean" },
          },
        },
        category: "Details",
      },

      // ── Serial Numbering ──
      {
        name: "updateSerial",
        description: "Configure serial numbering: enabled, prefix, startNumber, padLength.",
        parameters: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            prefix: { type: "string", description: "e.g. TKT" },
            startNumber: { type: "number" },
            padLength: { type: "number", description: "Zero-pad length (1-10)" },
          },
        },
        category: "Details",
      },

      // ── Organizer & Terms ──
      {
        name: "updateOrganizer",
        description: "Update organizer details, terms, and pricing: organizerName, organizerContact, organizerWebsite, terms, price, currency.",
        parameters: {
          type: "object",
          properties: {
            organizerName: { type: "string" },
            organizerContact: { type: "string" },
            organizerWebsite: { type: "string" },
            terms: { type: "string", description: "Terms and conditions / fine print" },
            price: { type: "string" },
            currency: { type: "string" },
          },
        },
        category: "Details",
      },

      // ── Prefill from Business Memory ──
      {
        name: "prefillFromMemory",
        description: "Auto-fill organizer fields from stored business profile (name, contact, website).",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },

      // ── Style ──
      {
        name: "setTemplate",
        description:
          "Apply a visual template. Options: classic-elegant, modern-minimal, bold-vibrant, dark-premium, retro-vintage, corporate-clean, festival-neon, sports-dynamic, airline-standard, cinema-classic. Sets accent color, font, and background unless color is locked.",
        parameters: {
          type: "object",
          properties: {
            template: {
              type: "string",
              enum: [
                "classic-elegant", "modern-minimal", "bold-vibrant", "dark-premium",
                "retro-vintage", "corporate-clean", "festival-neon", "sports-dynamic",
                "airline-standard", "cinema-classic",
              ],
            },
          },
          required: ["template"],
        },
        category: "Style",
      },

      {
        name: "updateStyle",
        description: "Update style settings: accentColor (hex), bgColor, textColor, fontPairing, fontScale, headerStyle (centered, left-aligned, split), showLogo, logoText.",
        parameters: {
          type: "object",
          properties: {
            accentColor: { type: "string", description: "Hex color (e.g. #3b82f6)" },
            bgColor: { type: "string" },
            textColor: { type: "string" },
            fontPairing: {
              type: "string",
              enum: ["playfair-lato", "inter-inter", "poppins-inter", "oswald-roboto", "dm-serif-dm-sans", "merriweather-opensans", "cormorant-montserrat", "crimson-source"],
            },
            fontScale: { type: "number", description: "0.85-1.2" },
            headerStyle: { type: "string", enum: ["centered", "left-aligned", "split"] },
            showLogo: { type: "boolean" },
            logoText: { type: "string" },
          },
        },
        category: "Style",
      },

      // ── Format ──
      {
        name: "updateFormat",
        description: "Update format/print settings: ticketSize (standard, small, large, boarding, wristband, a4-sheet, custom), margins (none, narrow, standard), bleed, cropMarks, ticketsPerPage.",
        parameters: {
          type: "object",
          properties: {
            ticketSize: {
              type: "string",
              enum: ["standard", "small", "large", "boarding", "wristband", "a4-sheet", "custom"],
            },
            margins: { type: "string", enum: ["none", "narrow", "standard"] },
            bleed: { type: "boolean" },
            cropMarks: { type: "boolean" },
            ticketsPerPage: { type: "number", description: "1-6 (for a4-sheet mode)" },
          },
        },
        category: "Format",
      },

      // ── Document ──
      {
        name: "resetForm",
        description: "Reset the ticket to defaults. Optionally specify a ticket type to start with.",
        parameters: {
          type: "object",
          properties: {
            ticketType: {
              type: "string",
              enum: ["event", "concert", "movie", "sports", "boarding-pass", "transit", "vip", "festival", "raffle", "parking", "admission", "conference"],
              description: "Optional: start with this ticket type",
            },
          },
        },
        category: "Document",
        destructive: true,
      },

      // ── Read ──
      {
        name: "readCurrentState",
        description: "Read the full current state of the ticket being designed.",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },

      // ── Export ──
      {
        name: "validateBeforePrint",
        description: "Check if the ticket is ready to print. Returns issues list with severity and field.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      {
        name: "exportPrint",
        description: "Trigger the browser print dialog to print/export the ticket as PDF.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
    ],

    // ── State reader ──
    getState: readTicketState,

    // ── Action Executor ──
    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      try {
        const store = useTicketEditor.getState();

        switch (actionName) {
          case "setTicketType":
            store.setTicketType(params.type as TicketType);
            return { success: true, message: `Ticket type changed to ${params.type}` };

          case "updateEvent":
            store.updateEvent(params as Partial<TicketFormData["event"]>);
            return { success: true, message: "Event info updated" };

          case "updateSeat":
            store.updateSeat(params as Partial<TicketFormData["seat"]>);
            return { success: true, message: "Seating updated" };

          case "updateAttendee":
            store.updateAttendee(params as Partial<TicketFormData["attendee"]>);
            return { success: true, message: "Attendee info updated" };

          case "updateBoarding":
            store.updateBoarding(params as Partial<TicketFormData["boarding"]>);
            return { success: true, message: "Boarding pass info updated" };

          case "updateBarcode":
            store.updateBarcode(params as Partial<TicketFormData["barcode"]>);
            return { success: true, message: "Barcode settings updated" };

          case "updateStub":
            store.updateStub(params as Partial<TicketFormData["stub"]>);
            return { success: true, message: "Stub settings updated" };

          case "updateSerial":
            store.updateSerial(params as Partial<TicketFormData["serial"]>);
            return { success: true, message: "Serial numbering updated" };

          case "updateOrganizer":
            store.updateOrganizer(params as Partial<Pick<TicketFormData, "organizerName" | "organizerContact" | "organizerWebsite" | "terms" | "price" | "currency">>);
            return { success: true, message: "Organizer info updated" };

          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) {
              return { success: false, message: "No business profile saved yet. Ask the user to set up their Business Memory first." };
            }
            const profile = memory.profile;
            if (profile.companyName) {
              store.updateOrganizer({ organizerName: profile.companyName } as Partial<Pick<TicketFormData, "organizerName">>);
            }
            if (profile.email) {
              store.updateOrganizer({ organizerContact: profile.email } as Partial<Pick<TicketFormData, "organizerContact">>);
            }
            if (profile.website) {
              store.updateOrganizer({ organizerWebsite: profile.website } as Partial<Pick<TicketFormData, "organizerWebsite">>);
            }
            return { success: true, message: `Organizer pre-filled: ${profile.companyName || "business profile"}` };
          }

          case "setTemplate":
            store.setTemplate(params.template as TicketTemplate);
            return { success: true, message: `Template set to ${params.template}` };

          case "updateStyle":
            store.updateStyle(params as Partial<TicketStyleConfig>);
            return { success: true, message: "Style updated" };

          case "updateFormat":
            store.updateFormat(params as Partial<TicketFormatConfig>);
            return { success: true, message: "Format settings updated" };

          case "resetForm":
            store.resetForm(params.ticketType as TicketType | undefined);
            return { success: true, message: "Ticket reset to defaults" };

          case "readCurrentState":
            return { success: true, message: "Current ticket state", newState: readTicketState() };

          case "validateBeforePrint": {
            const { issues, ready } = validateTicket();
            const errorCount = issues.filter((i) => i.severity === "error").length;
            const warningCount = issues.filter((i) => i.severity === "warning").length;
            let msg = "";
            if (ready && warningCount === 0) {
              msg = "Ticket is ready to print — no issues found.";
            } else if (ready) {
              msg = `Ticket can be printed but has ${warningCount} warning(s) to review:\n`;
              for (const i of issues) msg += `  ⚠ ${i.message}\n`;
            } else {
              msg = `Ticket has ${errorCount} error(s) and ${warningCount} warning(s):\n`;
              for (const i of issues) msg += `  ${i.severity === "error" ? "✘" : "⚠"} ${i.message}\n`;
            }
            return { success: true, message: msg.trim(), newState: { issues, ready, errorCount, warningCount } };
          }

          case "exportPrint": {
            const { issues, ready } = validateTicket();
            const errors = issues.filter((i) => i.severity === "error");
            if (!ready) {
              return {
                success: false,
                message: `Cannot print — ${errors.length} error(s) found:\n${errors.map((i) => `• ${i.message}`).join("\n")}`,
              };
            }
            const handler = options?.onPrintRef?.current;
            if (!handler) {
              return { success: false, message: "Export not ready yet — please wait and try again." };
            }
            handler();
            return { success: true, message: "Print dialog opened" };
          }

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Action failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useTicketEditor.getState().form,
    (snapshot) => useTicketEditor.getState().setForm(snapshot as TicketFormData),
  );
}
