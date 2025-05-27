import React from "react";
import { DynamicNotebook } from "../Components/DynamicNotebook";
import { NotebookModel } from "../Types/NotebookModel";

interface NotebookViewerProps {
  model: NotebookModel;
}

export function NotebookViewer({ model }: NotebookViewerProps) {
  return (
    <div className="notebook-viewer">
      <DynamicNotebook model={model} />
    </div>
  );
}


