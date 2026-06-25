"use client";

import { createElement } from "react";

export function Iconify({
  icon,
  width = 20,
  className,
}: {
  icon: string;
  width?: number | string;
  className?: string;
}) {
  return createElement("iconify-icon", { icon, width, class: className });
}
