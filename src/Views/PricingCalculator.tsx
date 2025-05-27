import React from "react";
import { DynamicNotebook } from "../Components/DynamicNotebook";
import pricingModel from "../Data/pricingModel.json";
import { NotebookModel } from "../Types/NotebookModel";

export function PricingCalculator() {
  return (
    <div className="pricing-calculator">
      <DynamicNotebook model={pricingModel as NotebookModel} />
    </div>
  );
}
