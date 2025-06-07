import React from "react";
import { DynamicNotebook } from "../components/DynamicNotebook";
import { NotebookModel } from "../Types/NotebookModel";

interface NotebookViewerProps {
  model: NotebookModel;
}

export function NotebookViewer({ model }: NotebookViewerProps) {
  return (
    <div className="notebook-viewer text-neutral-800 dark:text-neutral-300">
      <DynamicNotebook model={model} />
    </div>
  );
}


