"use client";

import { useEffect } from "react";
import { setupEstimator } from "./legacy-estimate";

export function LegacyCalculator() {
  useEffect(() => {
    const form = document.getElementById("estimate-form");
    if (form) setupEstimator(form);
  }, []);
  return null;
}
