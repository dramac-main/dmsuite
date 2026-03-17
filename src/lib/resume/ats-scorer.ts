// =============================================================================
// DMSuite — ATS Score Calculator
// Pure function: takes resume data + target role → returns 0-100 score
// with category-level breakdown and actionable recommendations.
// =============================================================================

import type { ResumeData } from "@/lib/resume/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ATSCategory {
  id: string;
  label: string;
  maxPoints: number;
  score: number;
  recommendations: ATSRecommendation[];
}

export interface ATSRecommendation {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  /** AI action to fix this (for clickable recommendations) */
  action?: {
    intent: string;
    params?: Record<string, unknown>;
  };
}

export interface ATSScoreResult {
  /** Overall score 0-100 */
  total: number;
  /** Percentage 0-1 */
  percentage: number;
  /** Letter grade */
  grade: "A" | "B" | "C" | "D" | "F";
  /** Color for the score badge */
  color: "green" | "yellow" | "orange" | "red";
  /** Category breakdown */
  categories: ATSCategory[];
  /** Top recommendations sorted by priority */
  topRecommendations: ATSRecommendation[];
}

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

export function calculateATSScore(
  resume: ResumeData,
  targetRole?: string,
  jobDescription?: string
): ATSScoreResult {
  const categories: ATSCategory[] = [
    scoreContactInfo(resume),
    scoreSummary(resume),
    scoreExperience(resume),
    scoreSkills(resume, targetRole, jobDescription),
    scoreEducation(resume),
    scoreSectionHeadings(resume),
    scoreLength(resume),
    scoreQuality(resume),
  ];

  const total = categories.reduce((sum, cat) => sum + cat.score, 0);
  const maxTotal = categories.reduce((sum, cat) => sum + cat.maxPoints, 0);
  const percentage = maxTotal > 0 ? total / maxTotal : 0;

  // Collect all recommendations
  const allRecs = categories.flatMap((cat) => cat.recommendations);
  const topRecommendations = allRecs
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 8);

  return {
    total: Math.round(percentage * 100),
    percentage,
    grade: getGrade(percentage),
    color: getColor(percentage),
    categories,
    topRecommendations,
  };
}

// ---------------------------------------------------------------------------
// Category 1: Contact Information (10 points)
// ---------------------------------------------------------------------------

function scoreContactInfo(resume: ResumeData): ATSCategory {
  const { basics } = resume;
  const recs: ATSRecommendation[] = [];
  let score = 0;

  if (basics.name.trim()) score += 3;
  else recs.push({ id: "contact-name", text: "Add your full name", priority: "high" });

  if (basics.email.trim()) score += 3;
  else recs.push({ id: "contact-email", text: "Add your email address", priority: "high" });

  if (basics.phone.trim()) score += 2;
  else recs.push({ id: "contact-phone", text: "Add your phone number", priority: "medium" });

  if (basics.location.trim()) score += 1;
  else recs.push({ id: "contact-location", text: "Add your location (city, state)", priority: "low" });

  if (basics.linkedin.trim()) score += 1;
  else recs.push({ id: "contact-linkedin", text: "Add your LinkedIn profile URL", priority: "low" });

  return { id: "contact", label: "Contact Information", maxPoints: 10, score, recommendations: recs };
}

// ---------------------------------------------------------------------------
// Category 2: Professional Summary (15 points)
// ---------------------------------------------------------------------------

function scoreSummary(resume: ResumeData): ATSCategory {
  const { sections } = resume;
  const recs: ATSRecommendation[] = [];
  let score = 0;

  const summary = sections.summary;
  if (summary.hidden || !summary.content.trim()) {
    recs.push({
      id: "summary-missing",
      text: "Add a professional summary to give recruiters a quick overview",
      priority: "high",
      action: { intent: "regenerate-section", params: { sectionId: "summary" } },
    });
    return { id: "summary", label: "Professional Summary", maxPoints: 15, score: 0, recommendations: recs };
  }

  const words = summary.content.trim().split(/\s+/).length;

  // Present and not hidden
  score += 5;

  // Substantive length (30-80 words ideal)
  if (words >= 25 && words <= 100) {
    score += 5;
  } else if (words < 25) {
    score += 2;
    recs.push({
      id: "summary-short",
      text: "Expand your summary — aim for 30-80 words",
      priority: "medium",
      action: { intent: "expand-section", params: { sectionId: "summary" } },
    });
  } else {
    score += 3;
    recs.push({
      id: "summary-long",
      text: "Shorten your summary — aim for 30-80 words",
      priority: "low",
      action: { intent: "shorten-section", params: { sectionId: "summary" } },
    });
  }

  // Contains relevant keywords (target role mention)
  const hasTargetKeywords = resume.basics.headline
    ? summary.content.toLowerCase().includes(resume.basics.headline.toLowerCase().split(" ")[0])
    : true;
  if (hasTargetKeywords) {
    score += 5;
  } else {
    score += 2;
    recs.push({
      id: "summary-keywords",
      text: "Mention your target role in the summary for better ATS matching",
      priority: "medium",
      action: { intent: "rewrite-section", params: { sectionId: "summary" } },
    });
  }

  return { id: "summary", label: "Professional Summary", maxPoints: 15, score, recommendations: recs };
}

// ---------------------------------------------------------------------------
// Category 3: Work Experience (20 points)
// ---------------------------------------------------------------------------

function scoreExperience(resume: ResumeData): ATSCategory {
  const { sections } = resume;
  const recs: ATSRecommendation[] = [];
  let score = 0;

  const exp = sections.experience;
  if (exp.hidden || exp.items.length === 0) {
    recs.push({
      id: "exp-missing",
      text: "Add work experience — this is the most important section for ATS",
      priority: "high",
    });
    return { id: "experience", label: "Work Experience", maxPoints: 20, score: 0, recommendations: recs };
  }

  const visibleItems = exp.items.filter((i) => !i.hidden);

  // Has experience entries
  score += 5;

  // Action verbs check
  const ACTION_VERBS = [
    "led", "developed", "implemented", "managed", "created", "designed",
    "built", "improved", "increased", "reduced", "launched", "delivered",
    "optimized", "established", "achieved", "drove", "spearheaded",
    "coordinated", "analyzed", "streamlined",
  ];

  let hasActionVerbs = false;
  let hasMetrics = false;
  let hasDescriptions = false;

  for (const item of visibleItems) {
    const desc = item.description.toLowerCase();
    if (desc.trim().length > 20) hasDescriptions = true;
    if (ACTION_VERBS.some((verb) => desc.includes(verb))) hasActionVerbs = true;
    if (/\d+%|\d+x|\$[\d,]+|\d+ (team|people|users|clients|projects)/.test(desc)) hasMetrics = true;
  }

  if (hasDescriptions) {
    score += 5;
  } else {
    recs.push({
      id: "exp-descriptions",
      text: "Add detailed descriptions to your work experience",
      priority: "high",
      action: { intent: "rewrite-section", params: { sectionId: "experience" } },
    });
  }

  if (hasActionVerbs) {
    score += 5;
  } else {
    recs.push({
      id: "exp-verbs",
      text: "Start bullet points with strong action verbs (Led, Developed, Implemented)",
      priority: "medium",
      action: { intent: "rewrite-section", params: { sectionId: "experience" } },
    });
  }

  if (hasMetrics) {
    score += 5;
  } else {
    score += 2;
    recs.push({
      id: "exp-metrics",
      text: "Add quantified achievements (percentages, dollar amounts, team sizes)",
      priority: "medium",
      action: { intent: "rewrite-section", params: { sectionId: "experience" } },
    });
  }

  return { id: "experience", label: "Work Experience", maxPoints: 20, score, recommendations: recs };
}

// ---------------------------------------------------------------------------
// Category 4: Skills (15 points)
// ---------------------------------------------------------------------------

function scoreSkills(
  resume: ResumeData,
  targetRole?: string,
  jobDescription?: string
): ATSCategory {
  const { sections } = resume;
  const recs: ATSRecommendation[] = [];
  let score = 0;

  const skills = sections.skills;
  if (skills.hidden || skills.items.length === 0) {
    recs.push({
      id: "skills-missing",
      text: "Add a skills section — ATS systems scan for keyword matches",
      priority: "high",
    });
    return { id: "skills", label: "Skills", maxPoints: 15, score: 0, recommendations: recs };
  }

  const allKeywords = skills.items
    .filter((i) => !i.hidden)
    .flatMap((i) => i.keywords);

  // Has skills
  score += 5;

  // Reasonable number of skills (5-25)
  if (allKeywords.length >= 5 && allKeywords.length <= 25) {
    score += 5;
  } else if (allKeywords.length < 5) {
    score += 2;
    recs.push({
      id: "skills-few",
      text: "Add more skills — aim for 8-15 relevant keywords",
      priority: "medium",
      action: { intent: "add-keywords" },
    });
  } else {
    score += 4;
    recs.push({
      id: "skills-many",
      text: "Consider reducing skills to the most relevant 15-20",
      priority: "low",
    });
  }

  // Keyword matching (if job description provided)
  if (jobDescription) {
    const jdLower = jobDescription.toLowerCase();
    const matchCount = allKeywords.filter((kw) =>
      jdLower.includes(kw.toLowerCase())
    ).length;
    const matchRate = allKeywords.length > 0 ? matchCount / allKeywords.length : 0;

    if (matchRate > 0.3) {
      score += 5;
    } else if (matchRate > 0.1) {
      score += 3;
      recs.push({
        id: "skills-match",
        text: "Add more keywords from the job description to improve ATS matching",
        priority: "high",
        action: { intent: "add-keywords" },
      });
    } else {
      score += 1;
      recs.push({
        id: "skills-mismatch",
        text: "Your skills don't match the job description well — tailor them",
        priority: "high",
        action: { intent: "tailor-for-job" },
      });
    }
  } else {
    // No JD — give partial credit
    score += 3;
    recs.push({
      id: "skills-no-jd",
      text: "Paste a job description to get keyword matching analysis",
      priority: "low",
    });
  }

  return { id: "skills", label: "Skills", maxPoints: 15, score, recommendations: recs };
}

// ---------------------------------------------------------------------------
// Category 5: Education (10 points)
// ---------------------------------------------------------------------------

function scoreEducation(resume: ResumeData): ATSCategory {
  const { sections } = resume;
  const recs: ATSRecommendation[] = [];
  let score = 0;

  const edu = sections.education;
  if (edu.hidden || edu.items.length === 0) {
    recs.push({
      id: "edu-missing",
      text: "Add your education — most ATS systems check for this",
      priority: "medium",
    });
    return { id: "education", label: "Education", maxPoints: 10, score: 0, recommendations: recs };
  }

  const visibleItems = edu.items.filter((i) => !i.hidden);

  // Has education
  score += 4;

  // Has degree and institution
  const hasComplete = visibleItems.some(
    (item) => item.institution.trim() && (item.degree.trim() || item.field.trim())
  );
  if (hasComplete) {
    score += 3;
  } else {
    score += 1;
    recs.push({
      id: "edu-incomplete",
      text: "Complete your education details (degree, institution, field of study)",
      priority: "medium",
    });
  }

  // Has graduation year
  const hasYear = visibleItems.some((item) => item.graduationYear.trim());
  if (hasYear) {
    score += 3;
  } else {
    score += 1;
    recs.push({
      id: "edu-year",
      text: "Add graduation year to your education entries",
      priority: "low",
    });
  }

  return { id: "education", label: "Education", maxPoints: 10, score, recommendations: recs };
}

// ---------------------------------------------------------------------------
// Category 6: Section Headings (10 points)
// ---------------------------------------------------------------------------

const STANDARD_HEADINGS = new Set([
  "professional summary", "summary", "profile", "about",
  "work experience", "experience", "employment",
  "education", "academic background",
  "skills", "technical skills", "core competencies",
  "certifications", "licenses", "credentials",
  "languages",
  "volunteer experience", "community involvement",
  "projects", "key projects",
  "awards", "honors",
  "references",
]);

function scoreSectionHeadings(resume: ResumeData): ATSCategory {
  const recs: ATSRecommendation[] = [];
  let score = 0;

  const sectionTitles: string[] = [];

  // Collect all visible section titles
  const s = resume.sections;
  if (!s.summary.hidden) sectionTitles.push(s.summary.title);
  const listSections = [
    s.experience, s.education, s.skills, s.certifications,
    s.languages, s.volunteer, s.projects, s.awards, s.references,
  ];
  for (const sect of listSections) {
    if (!sect.hidden && sect.items.length > 0) {
      sectionTitles.push(sect.title);
    }
  }

  if (sectionTitles.length === 0) {
    return { id: "headings", label: "Section Headings", maxPoints: 10, score: 0, recommendations: recs };
  }

  // Check standard names
  const standardCount = sectionTitles.filter((t) =>
    STANDARD_HEADINGS.has(t.toLowerCase())
  ).length;
  const standardRate = standardCount / sectionTitles.length;

  if (standardRate >= 0.8) {
    score += 10;
  } else if (standardRate >= 0.5) {
    score += 7;
    recs.push({
      id: "headings-nonstandard",
      text: "Use standard section headings that ATS systems recognize (e.g., \"Work Experience\" not \"My Journey\")",
      priority: "medium",
    });
  } else {
    score += 4;
    recs.push({
      id: "headings-custom",
      text: "Rename sections to standard ATS-friendly headings",
      priority: "high",
    });
  }

  return { id: "headings", label: "Section Headings", maxPoints: 10, score, recommendations: recs };
}

// ---------------------------------------------------------------------------
// Category 7: Resume Length (10 points)
// ---------------------------------------------------------------------------

function scoreLength(resume: ResumeData): ATSCategory {
  const recs: ATSRecommendation[] = [];
  let score = 0;

  // Estimate word count
  const allText = collectAllText(resume);
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const pageCount = resume.metadata.layout.pages.length;

  // Ideal: 300-700 words for 1-page, 600-1200 for 2-page
  if (pageCount <= 1) {
    if (wordCount >= 250 && wordCount <= 800) {
      score += 10;
    } else if (wordCount < 250) {
      score += 5;
      recs.push({
        id: "length-short",
        text: "Your resume seems short — add more detail to your experience",
        priority: "medium",
        action: { intent: "expand-section", params: { sectionId: "experience" } },
      });
    } else {
      score += 6;
      recs.push({
        id: "length-long",
        text: "Consider shortening to fit one page — ATS prefers concise resumes",
        priority: "low",
        action: { intent: "fit-to-pages" },
      });
    }
  } else {
    if (wordCount >= 500 && wordCount <= 1400) {
      score += 10;
    } else if (wordCount < 500) {
      score += 6;
      recs.push({
        id: "length-short-2p",
        text: "If using two pages, add more substantive content",
        priority: "medium",
      });
    } else {
      score += 5;
      recs.push({
        id: "length-long-2p",
        text: "Your resume is quite long — consider trimming less relevant content",
        priority: "low",
        action: { intent: "fit-to-pages" },
      });
    }
  }

  return { id: "length", label: "Resume Length", maxPoints: 10, score, recommendations: recs };
}

// ---------------------------------------------------------------------------
// Category 8: Quality / Red Flags (10 points)
// ---------------------------------------------------------------------------

function scoreQuality(resume: ResumeData): ATSCategory {
  const recs: ATSRecommendation[] = [];
  let score = 10; // Start with full points, deduct

  const allText = collectAllText(resume).toLowerCase();

  // Check for first-person pronouns
  if (/\bi\b|\bmy\b|\bme\b|\bmyself\b/.test(allText)) {
    score -= 2;
    recs.push({
      id: "quality-pronouns",
      text: "Remove first-person pronouns (I, my, me) — use third-person or implied subject",
      priority: "medium",
      action: { intent: "rewrite-section", params: { sectionId: "summary" } },
    });
  }

  // Check for generic phrases
  const genericPhrases = [
    "responsible for", "duties included", "helped with",
    "worked on", "assisted in", "participated in",
  ];
  const hasGeneric = genericPhrases.some((phrase) => allText.includes(phrase));
  if (hasGeneric) {
    score -= 2;
    recs.push({
      id: "quality-generic",
      text: "Replace generic phrases like \"responsible for\" with action verbs",
      priority: "medium",
      action: { intent: "rewrite-section", params: { sectionId: "experience" } },
    });
  }

  // Check date consistency
  const expItems = resume.sections.experience.items.filter((i) => !i.hidden);
  const hasInconsistentDates = expItems.some((item) => {
    const hasStart = item.startDate.trim().length > 0;
    const hasEnd = item.endDate.trim().length > 0 || item.isCurrent;
    return hasStart !== hasEnd;
  });
  if (hasInconsistentDates) {
    score -= 2;
    recs.push({
      id: "quality-dates",
      text: "Ensure consistent date formatting across all positions",
      priority: "low",
    });
  }

  // Ensure no large gaps implied (simple check: more than 2 items, none current)
  const hasCurrent = expItems.some((i) => i.isCurrent);
  if (expItems.length > 0 && !hasCurrent) {
    score -= 1;
    recs.push({
      id: "quality-gap",
      text: "If you're currently employed, mark your current position as \"Present\"",
      priority: "low",
    });
  }

  // Check for typo indicators (very basic)
  if (allText.includes("  ") || allText.includes("..")) {
    score -= 1;
    recs.push({
      id: "quality-formatting",
      text: "Clean up double spaces and formatting inconsistencies",
      priority: "low",
    });
  }

  score = Math.max(0, score);

  return { id: "quality", label: "Quality & Red Flags", maxPoints: 10, score, recommendations: recs };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectAllText(resume: ResumeData): string {
  const parts: string[] = [];

  // Basics
  parts.push(resume.basics.name, resume.basics.headline);

  // Summary
  if (!resume.sections.summary.hidden) {
    parts.push(resume.sections.summary.content);
  }

  // All list sections
  const listSections = [
    resume.sections.experience,
    resume.sections.education,
    resume.sections.skills,
    resume.sections.certifications,
    resume.sections.languages,
    resume.sections.volunteer,
    resume.sections.projects,
    resume.sections.awards,
    resume.sections.references,
  ];

  for (const sect of listSections) {
    if (sect.hidden) continue;
    for (const item of sect.items) {
      if ((item as { hidden: boolean }).hidden) continue;
      parts.push(...Object.values(item).filter((v): v is string => typeof v === "string"));
      // Keywords arrays
      if ("keywords" in item && Array.isArray((item as { keywords: string[] }).keywords)) {
        parts.push(...(item as { keywords: string[] }).keywords);
      }
    }
  }

  return parts.filter(Boolean).join(" ");
}

function getGrade(percentage: number): "A" | "B" | "C" | "D" | "F" {
  if (percentage >= 0.85) return "A";
  if (percentage >= 0.7) return "B";
  if (percentage >= 0.55) return "C";
  if (percentage >= 0.4) return "D";
  return "F";
}

function getColor(percentage: number): "green" | "yellow" | "orange" | "red" {
  if (percentage >= 0.75) return "green";
  if (percentage >= 0.55) return "yellow";
  if (percentage >= 0.35) return "orange";
  return "red";
}
