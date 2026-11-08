"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { v4 as uuid } from "uuid";

/** Legt einen neuen Tisch aus einer Vorlage an und öffnet ihn. */
export default function TemplateCard({
  templateId,
  children,
  className = "",
}: {
  templateId: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/room/${uuid().slice(0, 8)}?t=${templateId}`)}
      className={`text-left ${className}`}
    >
      {children}
    </button>
  );
}
