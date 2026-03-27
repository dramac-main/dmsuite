"use client";

import { useState, useRef, useCallback } from "react";
import {
  useIDBadgeEditor,
  ROLE_VARIANTS,
  type BatchPerson,
} from "@/stores/id-badge-editor";
import {
  AccordionSection,
  FormInput,
  SectionLabel,
  Toggle,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ── Icons ───────────────────────────────────────────────────────────────────

const icons = {
  batch: <SIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  upload: <SIcon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
  add: <SIcon d="M12 4v16m8-8H4" />,
  preview: <SIcon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
  download: <SIcon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
};

const CSV_TEMPLATE = `firstName,lastName,title,department,employeeId,email,phone,role,accessLevel,photoUrl
John,Mwamba,Software Engineer,Technology,EMP-001,john@example.com,+260977123456,staff,Level 2,
Jane,Banda,HR Director,Human Resources,EMP-002,jane@example.com,+260966789012,manager,Level 3,`;

// ── CSV Parser ──────────────────────────────────────────────────────────────

function parseCsv(text: string): BatchPerson[] {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

  const fieldMap: Record<string, keyof BatchPerson> = {
    firstname: "firstName",
    first_name: "firstName",
    "first name": "firstName",
    lastname: "lastName",
    last_name: "lastName",
    "last name": "lastName",
    surname: "lastName",
    title: "title",
    jobtitle: "title",
    "job title": "title",
    job_title: "title",
    position: "title",
    department: "department",
    dept: "department",
    employeeid: "employeeId",
    employee_id: "employeeId",
    "employee id": "employeeId",
    id: "employeeId",
    staffid: "employeeId",
    email: "email",
    phone: "phone",
    tel: "phone",
    telephone: "phone",
    mobile: "phone",
    role: "role",
    accesslevel: "accessLevel",
    access_level: "accessLevel",
    "access level": "accessLevel",
    photourl: "photoUrl",
    photo_url: "photoUrl",
    photo: "photoUrl",
    image: "photoUrl",
  };

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const person: BatchPerson = {
      id: crypto.randomUUID(),
      firstName: "",
      lastName: "",
      title: "",
      department: "",
      employeeId: "",
      email: "",
      phone: "",
      role: "staff",
      accessLevel: "",
      photoUrl: "",
      customField1: "",
      customField2: "",
    };

    headers.forEach((header, i) => {
      const key = fieldMap[header];
      if (key && values[i] !== undefined) {
        (person as unknown as Record<string, string>)[key] = values[i];
      }
    });

    return person;
  });
}

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function IDBadgeBatchTab() {
  const form = useIDBadgeEditor((s) => s.form);
  const setBatchMode = useIDBadgeEditor((s) => s.setBatchMode);
  const addBatchPerson = useIDBadgeEditor((s) => s.addBatchPerson);
  const updateBatchPerson = useIDBadgeEditor((s) => s.updateBatchPerson);
  const removeBatchPerson = useIDBadgeEditor((s) => s.removeBatchPerson);
  const clearBatch = useIDBadgeEditor((s) => s.clearBatch);
  const importBatchData = useIDBadgeEditor((s) => s.importBatchData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openSection, setOpenSection] = useState<string | null>("import");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [importError, setImportError] = useState("");

  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setImportError("");
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
        setImportError("Please upload a CSV file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = ev.target?.result as string;
          const people = parseCsv(text);
          if (people.length === 0) {
            setImportError("No valid rows found. Check the CSV format.");
            return;
          }
          importBatchData(people);
          setBatchMode(true);
          setImportError("");
        } catch {
          setImportError("Failed to parse CSV file.");
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be re-uploaded
      e.target.value = "";
    },
    [importBatchData, setBatchMode],
  );

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "badge-batch-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddPerson = () => {
    addBatchPerson();
    setEditingIdx(form.batchPeople.length);
    setBatchMode(true);
  };

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Batch Toggle ── */}
      <div className="px-4 py-3">
        <Toggle
          label="Batch / Bulk Mode"
          description="Generate multiple badges from a list of people"
          checked={form.batchMode}
          onChange={(v) => setBatchMode(v)}
        />
        {form.batchMode && form.batchPeople.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 font-medium">
              {form.batchPeople.length} {form.batchPeople.length === 1 ? "person" : "people"}
            </span>
            <button
              onClick={clearBatch}
              className="text-red-400/70 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Import ── */}
      <AccordionSection
        title="Import Data"
        icon={icons.upload}
        isOpen={openSection === "import"}
        onToggle={() => toggle("import")}
      >
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[10px] text-gray-600">
            Upload a CSV file with columns: firstName, lastName, title, department, employeeId, email, phone, role, accessLevel, photoUrl
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700/40 bg-gray-800/40 hover:bg-gray-700/50 transition-colors text-[11px] text-gray-300"
            >
              {icons.upload} Upload CSV
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700/40 bg-gray-800/40 hover:bg-gray-700/50 transition-colors text-[11px] text-gray-300"
            >
              {icons.download} Download Template
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          {importError && (
            <p className="text-[10px] text-red-400">{importError}</p>
          )}
        </div>
      </AccordionSection>

      {/* ── People List ── */}
      <AccordionSection
        title="People List"
        icon={icons.batch}
        isOpen={openSection === "people"}
        onToggle={() => toggle("people")}
        badge={form.batchPeople.length > 0 ? `${form.batchPeople.length}` : undefined}
      >
        <div className="px-4 pb-4 space-y-2">
          {/* List */}
          {form.batchPeople.length === 0 ? (
            <div className="text-center py-6 text-gray-600">
              <svg className="w-8 h-8 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-[10px]">No people added yet</p>
              <p className="text-[9px] text-gray-700 mt-1">Upload a CSV or add manually</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-gray-700">
              {form.batchPeople.map((person, idx) => (
                <div key={person.id}>
                  {/* Row summary */}
                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      editingIdx === idx
                        ? "border-primary-500/40 bg-primary-500/5"
                        : "border-gray-700/30 bg-gray-800/20 hover:bg-gray-800/40"
                    }`}
                    onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                  >
                    {/* Avatar placeholder */}
                    <div className="w-7 h-7 rounded-full bg-gray-800/60 border border-gray-700/40 flex items-center justify-center text-[9px] text-gray-500 font-medium flex-shrink-0">
                      {(person.firstName?.[0] || "").toUpperCase()}{(person.lastName?.[0] || "").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-300 truncate font-medium">
                        {person.firstName || person.lastName
                          ? `${person.firstName} ${person.lastName}`.trim()
                          : `Person ${idx + 1}`}
                      </div>
                      <div className="text-[9px] text-gray-600 truncate">
                        {person.title || person.department || "No details"}
                      </div>
                    </div>
                    {/* Role badge */}
                    {person.role && (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{
                          background: `${ROLE_VARIANTS.find((r) => r.id === person.role)?.color ?? "#6b7280"}20`,
                          color: ROLE_VARIANTS.find((r) => r.id === person.role)?.color ?? "#6b7280",
                        }}
                      >
                        {ROLE_VARIANTS.find((r) => r.id === person.role)?.label ?? person.role}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeBatchPerson(person.id); }}
                      className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded edit form */}
                  {editingIdx === idx && (
                    <div className="ml-4 mt-1 p-3 rounded-lg border border-gray-700/20 bg-gray-800/10 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <FormInput
                          label="First Name"
                          value={person.firstName}
                          onChange={(e) => updateBatchPerson(person.id, { firstName: e.target.value })}
                          placeholder="First"
                        />
                        <FormInput
                          label="Last Name"
                          value={person.lastName}
                          onChange={(e) => updateBatchPerson(person.id, { lastName: e.target.value })}
                          placeholder="Last"
                        />
                      </div>
                      <FormInput
                        label="Title"
                        value={person.title}
                        onChange={(e) => updateBatchPerson(person.id, { title: e.target.value })}
                        placeholder="Job Title"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <FormInput
                          label="Department"
                          value={person.department}
                          onChange={(e) => updateBatchPerson(person.id, { department: e.target.value })}
                          placeholder="Dept"
                        />
                        <FormInput
                          label="Employee ID"
                          value={person.employeeId}
                          onChange={(e) => updateBatchPerson(person.id, { employeeId: e.target.value })}
                          placeholder="EMP-001"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormInput
                          label="Email"
                          value={person.email}
                          onChange={(e) => updateBatchPerson(person.id, { email: e.target.value })}
                          placeholder="email@co.com"
                        />
                        <FormInput
                          label="Phone"
                          value={person.phone}
                          onChange={(e) => updateBatchPerson(person.id, { phone: e.target.value })}
                          placeholder="+260..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <SectionLabel>Role</SectionLabel>
                          <select
                            className="w-full mt-1 px-2 py-1.5 rounded-md border border-gray-700/40 bg-gray-800/40 text-[11px] text-gray-300"
                            value={person.role}
                            onChange={(e) => updateBatchPerson(person.id, { role: e.target.value as BatchPerson["role"] })}
                          >
                            {ROLE_VARIANTS.map((r) => (
                              <option key={r.id} value={r.id}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        <FormInput
                          label="Access Level"
                          value={person.accessLevel}
                          onChange={(e) => updateBatchPerson(person.id, { accessLevel: e.target.value })}
                          placeholder="Level 2"
                        />
                      </div>
                      <FormInput
                        label="Photo URL"
                        value={person.photoUrl}
                          onChange={(e) => updateBatchPerson(person.id, { photoUrl: e.target.value })}
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add button */}
          <button
            onClick={handleAddPerson}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-700/40 text-[11px] text-gray-500 hover:text-gray-300 hover:border-gray-600/60 hover:bg-gray-800/30 transition-colors"
          >
            {icons.add} Add Person
          </button>
        </div>
      </AccordionSection>

      {/* ── Batch Preview ── */}
      {form.batchMode && form.batchPeople.length > 0 && (
        <AccordionSection
          title="Batch Preview"
          icon={icons.preview}
          isOpen={openSection === "preview"}
          onToggle={() => toggle("preview")}
        >
          <div className="px-4 pb-4 space-y-2">
            <p className="text-[10px] text-gray-600">
              Navigate between badges in the preview pane using the controls above the canvas.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {form.batchPeople.map((person, idx) => (
                <div
                  key={person.id}
                  className="p-2 rounded-md border border-gray-700/30 bg-gray-800/20 text-center"
                >
                  <div className="w-8 h-8 mx-auto rounded-full bg-gray-700/30 border border-gray-700/40 flex items-center justify-center text-[8px] text-gray-500 font-medium mb-1">
                    {(person.firstName?.[0] || "").toUpperCase()}{(person.lastName?.[0] || "").toUpperCase()}
                  </div>
                  <div className="text-[9px] text-gray-400 truncate">
                    {person.firstName || `Person ${idx + 1}`}
                  </div>
                  {person.role && (
                    <span
                      className="inline-block mt-0.5 text-[7px] px-1 py-0.5 rounded-full font-medium"
                      style={{
                        background: `${ROLE_VARIANTS.find((r) => r.id === person.role)?.color ?? "#6b7280"}15`,
                        color: ROLE_VARIANTS.find((r) => r.id === person.role)?.color ?? "#6b7280",
                      }}
                    >
                      {person.role}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AccordionSection>
      )}
    </div>
  );
}
