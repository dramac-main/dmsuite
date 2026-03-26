// =============================================================================
// DMSuite — Resume Contact Tab
// Personal/contact info editor. Mirrors Contract's Parties tab pattern:
// flat form layout, no accordions, clean and direct.
// =============================================================================

"use client";

import { useResumeEditor } from "@/stores/resume-editor";

// ── Shared input style ──
const INPUT_CLS =
  "w-full rounded-lg border border-gray-700/60 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60 transition-colors";

// =============================================================================
// Main Component
// =============================================================================

export default function ResumeContactTab() {
  const resume = useResumeEditor((s) => s.resume);
  const updateResume = useResumeEditor((s) => s.updateResume);

  const basics = resume.basics;

  return (
    <div className="space-y-5 p-4">
      {/* ── Name & Headline ── */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          Full Name
        </label>
        <input
          value={basics.name}
          onChange={(e) =>
            updateResume((d) => {
              d.basics.name = e.target.value;
            })
          }
          placeholder="John Doe"
          className={INPUT_CLS}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          Professional Headline
        </label>
        <input
          value={basics.headline}
          onChange={(e) =>
            updateResume((d) => {
              d.basics.headline = e.target.value;
            })
          }
          placeholder="Senior Software Engineer"
          className={INPUT_CLS}
        />
      </div>

      {/* ── Contact Details ── */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60 pb-1.5">
          Contact Details
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Email
            </label>
            <input
              value={basics.email}
              onChange={(e) =>
                updateResume((d) => {
                  d.basics.email = e.target.value;
                })
              }
              placeholder="john@example.com"
              type="email"
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Phone
            </label>
            <input
              value={basics.phone}
              onChange={(e) =>
                updateResume((d) => {
                  d.basics.phone = e.target.value;
                })
              }
              placeholder="+260 97X XXX XXX"
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Location
          </label>
          <input
            value={basics.location}
            onChange={(e) =>
              updateResume((d) => {
                d.basics.location = e.target.value;
              })
            }
            placeholder="Lusaka, Zambia"
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* ── Online Profiles ── */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60 pb-1.5">
          Online Profiles
        </h3>
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            LinkedIn
          </label>
          <input
            value={basics.linkedin}
            onChange={(e) =>
              updateResume((d) => {
                d.basics.linkedin = e.target.value;
              })
            }
            placeholder="linkedin.com/in/johndoe"
            className={INPUT_CLS}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Website / Portfolio
          </label>
          <input
            value={basics.website.url}
            onChange={(e) =>
              updateResume((d) => {
                d.basics.website.url = e.target.value;
              })
            }
            placeholder="https://johndoe.com"
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* ── Professional Summary ── */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60 pb-1.5">
          Professional Summary
        </h3>
        <textarea
          value={resume.sections.summary.content}
          onChange={(e) =>
            updateResume((d) => {
              d.sections.summary.content = e.target.value;
            })
          }
          placeholder="Write a brief professional summary highlighting your key strengths and career objectives..."
          rows={5}
          className={`${INPUT_CLS} resize-none`}
        />
        <p className="text-[10px] text-gray-600">
          {resume.sections.summary.content.length} characters
        </p>
      </div>
    </div>
  );
}
