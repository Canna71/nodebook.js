import React from "react";
import { DynamicNotebook } from "../components/DynamicNotebook";
import { NotebookModel } from "../Types/NotebookModel";
import { useApplication } from "@/Engine/ApplicationProvider"; // NEW: Import application context

interface NotebookViewerProps {
  model: NotebookModel;
}

export function NotebookViewer({ model }: NotebookViewerProps) {
  const { readingMode } = useApplication(); // NEW: Get reading mode from application state

  return (
    <div className="notebook-viewer text-neutral-800 dark:text-neutral-300">
      <DynamicNotebook 
        model={model} 
        readingMode={readingMode} // NEW: Pass reading mode to DynamicNotebook
      />
    </div>
  );
}


