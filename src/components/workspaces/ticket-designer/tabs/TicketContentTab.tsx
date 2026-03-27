"use client";

import { useState } from "react";
import {
  useTicketEditor,
  TICKET_TYPES,
  type TicketType,
} from "@/stores/ticket-editor";
import {
  AccordionSection,
  FormInput,
  FormSelect,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ━━━ SVG paths ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ICON = {
  ticket: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  seat: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7",
  plane: "M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
};

export default function TicketContentTab() {
  const form = useTicketEditor((s) => s.form);
  const setTicketType = useTicketEditor((s) => s.setTicketType);
  const updateEvent = useTicketEditor((s) => s.updateEvent);
  const updateSeat = useTicketEditor((s) => s.updateSeat);
  const updateBoarding = useTicketEditor((s) => s.updateBoarding);

  const [openSection, setOpenSection] = useState<string | null>("type");
  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  const isBoardingPass = form.ticketType === "boarding-pass";

  return (
    <div className="flex flex-col gap-1 p-2">
      {/* ─── Ticket Type ─── */}
      <AccordionSection
        title="Ticket Type"
        icon={<SIcon d={ICON.ticket} />}
        isOpen={openSection === "type"}
        onToggle={() => toggle("type")}
        badge={TICKET_TYPES.find((t) => t.id === form.ticketType)?.label}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {TICKET_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTicketType(t.id)}
              className={`rounded-md px-2.5 py-2 text-left text-[11px] transition-all border ${
                form.ticketType === t.id
                  ? "border-primary-500 bg-primary-500/10 text-primary-300"
                  : "border-gray-700/40 bg-gray-800/20 text-gray-400 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              <div className="font-medium truncate">{t.label}</div>
              <div className="text-[9px] text-gray-500 truncate mt-0.5">{t.description}</div>
            </button>
          ))}
        </div>
      </AccordionSection>

      {/* ─── Event Details ─── */}
      <AccordionSection
        title="Event Details"
        icon={<SIcon d={ICON.calendar} />}
        isOpen={openSection === "event"}
        onToggle={() => toggle("event")}
        badge={form.event.eventName ? "✓" : undefined}
      >
        <div className="flex flex-col gap-2">
          <FormInput
            label="Event Name"
            value={form.event.eventName}
            onChange={(e) => updateEvent({ eventName: e.target.value })}
            placeholder="e.g. Summer Music Festival"
          />
          <FormInput
            label="Subtitle"
            value={form.event.eventSubtitle}
            onChange={(e) => updateEvent({ eventSubtitle: e.target.value })}
            placeholder="e.g. Featuring DJ Shadow"
          />
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Date"
              type="date"
              value={form.event.date}
              onChange={(e) => updateEvent({ date: e.target.value })}
            />
            <FormInput
              label="Time"
              type="time"
              value={form.event.time}
              onChange={(e) => updateEvent({ time: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="End Date"
              type="date"
              value={form.event.endDate}
              onChange={(e) => updateEvent({ endDate: e.target.value })}
            />
            <FormInput
              label="End Time"
              type="time"
              value={form.event.endTime}
              onChange={(e) => updateEvent({ endTime: e.target.value })}
            />
          </div>
          <FormInput
            label="Doors Open"
            type="time"
            value={form.event.doors}
            onChange={(e) => updateEvent({ doors: e.target.value })}
          />
        </div>
      </AccordionSection>

      {/* ─── Venue ─── */}
      <AccordionSection
        title="Venue"
        icon={<SIcon d={ICON.location} />}
        isOpen={openSection === "venue"}
        onToggle={() => toggle("venue")}
        badge={form.event.venueName ? "✓" : undefined}
      >
        <div className="flex flex-col gap-2">
          <FormInput
            label="Venue Name"
            value={form.event.venueName}
            onChange={(e) => updateEvent({ venueName: e.target.value })}
            placeholder="e.g. The Grand Arena"
          />
          <FormInput
            label="Address"
            value={form.event.venueAddress}
            onChange={(e) => updateEvent({ venueAddress: e.target.value })}
            placeholder="e.g. 123 Main St, New York, NY"
          />
        </div>
      </AccordionSection>

      {/* ─── Seating (non-boarding) ─── */}
      {!isBoardingPass && (
        <AccordionSection
          title="Seating"
          icon={<SIcon d={ICON.seat} />}
          isOpen={openSection === "seat"}
          onToggle={() => toggle("seat")}
          badge={form.seat.seat || form.seat.section ? "✓" : undefined}
        >
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="Section"
                value={form.seat.section}
                onChange={(e) => updateSeat({ section: e.target.value })}
                placeholder="e.g. A"
              />
              <FormInput
                label="Row"
                value={form.seat.row}
                onChange={(e) => updateSeat({ row: e.target.value })}
                placeholder="e.g. 12"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="Seat"
                value={form.seat.seat}
                onChange={(e) => updateSeat({ seat: e.target.value })}
                placeholder="e.g. 5"
              />
              <FormInput
                label="Gate"
                value={form.seat.gate}
                onChange={(e) => updateSeat({ gate: e.target.value })}
                placeholder="e.g. B"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="Zone"
                value={form.seat.zone}
                onChange={(e) => updateSeat({ zone: e.target.value })}
                placeholder="e.g. VIP"
              />
              <FormInput
                label="Floor"
                value={form.seat.floor}
                onChange={(e) => updateSeat({ floor: e.target.value })}
                placeholder="e.g. 2"
              />
            </div>
          </div>
        </AccordionSection>
      )}

      {/* ─── Boarding Pass Fields ─── */}
      {isBoardingPass && (
        <AccordionSection
          title="Flight Details"
          icon={<SIcon d={ICON.plane} />}
        isOpen={openSection === "boarding"}
          onToggle={() => toggle("boarding")}
          badge={form.boarding.flightNumber ? "✓" : undefined}
        >
          <div className="flex flex-col gap-2">
            <FormInput
              label="Airline"
              value={form.boarding.airline}
              onChange={(e) => updateBoarding({ airline: e.target.value })}
              placeholder="e.g. Emirates"
            />
            <FormInput
              label="Flight Number"
              value={form.boarding.flightNumber}
              onChange={(e) => updateBoarding({ flightNumber: e.target.value })}
              placeholder="e.g. EK 201"
            />
            <SectionLabel>Departure</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="City"
                value={form.boarding.departureCity}
                onChange={(e) => updateBoarding({ departureCity: e.target.value })}
                placeholder="e.g. New York"
              />
              <FormInput
                label="Code"
                value={form.boarding.departureCode}
                onChange={(e) => updateBoarding({ departureCode: e.target.value.toUpperCase().slice(0, 3) })}
                placeholder="JFK"
              />
            </div>
            <SectionLabel>Arrival</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="City"
                value={form.boarding.arrivalCity}
                onChange={(e) => updateBoarding({ arrivalCity: e.target.value })}
                placeholder="e.g. Dubai"
              />
              <FormInput
                label="Code"
                value={form.boarding.arrivalCode}
                onChange={(e) => updateBoarding({ arrivalCode: e.target.value.toUpperCase().slice(0, 3) })}
                placeholder="DXB"
              />
            </div>
            <SectionLabel>Boarding</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="Boarding Time"
                type="time"
                value={form.boarding.boardingTime}
                onChange={(e) => updateBoarding({ boardingTime: e.target.value })}
              />
              <FormInput
                label="Departure Time"
                type="time"
                value={form.boarding.departureTime}
                onChange={(e) => updateBoarding({ departureTime: e.target.value })}
              />
            </div>
            <FormInput
              label="Passenger Name"
              value={form.boarding.passengerName}
              onChange={(e) => updateBoarding({ passengerName: e.target.value })}
              placeholder="e.g. SMITH/JOHN"
            />
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="Seat Number"
                value={form.boarding.seatNumber}
                onChange={(e) => updateBoarding({ seatNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. 14A"
              />
              <FormSelect
                label="Class"
                value={form.boarding.travelClass}
                onChange={(e) => updateBoarding({ travelClass: e.target.value })}
              >
                <option value="Economy">Economy</option>
                <option value="Premium Economy">Premium Economy</option>
                <option value="Business">Business</option>
                <option value="First Class">First Class</option>
              </FormSelect>
            </div>
            <FormInput
              label="Boarding Group"
              value={form.boarding.boardingGroup}
              onChange={(e) => updateBoarding({ boardingGroup: e.target.value })}
              placeholder="e.g. A"
            />
          </div>
        </AccordionSection>
      )}
    </div>
  );
}
