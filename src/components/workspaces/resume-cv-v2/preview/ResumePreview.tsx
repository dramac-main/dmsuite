"use client";
/**
 * ResumePreview — The artboard that renders resume pages
 * Adapted from Reactive Resume v5 preview.tsx
 */
import React, { useMemo } from "react";
import { useResumeV2Editor } from "@/stores/resume-v2-editor";
import { useCSSVariables, useWebfonts } from "@/lib/resume-v2/hooks";
import { getTemplateComponent } from "./templates";
import styles from "./preview.module.css";

export default function ResumePreview() {
  const resumeData = useResumeV2Editor((s) => s.resume);
  const { metadata, picture } = resumeData;

  // CSS variables for page rendering
  const cssVars = useCSSVariables({ picture, metadata });

  // Load Google Fonts for the typography
  useWebfonts(metadata.typography);

  // Template component
  const TemplateComponent = useMemo(
    () => getTemplateComponent(metadata.template),
    [metadata.template]
  );

  // Build page layouts
  const pages = metadata.layout.pages;

  // Custom CSS injection
  const customCSS = metadata.css?.value || "";

  return (
    <div className="rv2-preview flex flex-col items-center gap-6">
      {pages.map((pageLayout, pageIndex) => (
        <div
          key={pageIndex}
          className={styles.rv2Page}
          style={cssVars}
          data-format={metadata.page.format}
          data-page={pageIndex}
        >
          <TemplateComponent
            pageIndex={pageIndex}
            pageLayout={pageLayout}
          />
        </div>
      ))}

      {/* Custom CSS injection */}
      {customCSS && (
        <style dangerouslySetInnerHTML={{ __html: customCSS }} />
      )}
    </div>
  );
}
