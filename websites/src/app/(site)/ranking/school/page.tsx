import type { Metadata } from "next";
import { Suspense } from "react";
import { SchoolPage } from "@/components/ranking/SchoolPage";

export const metadata: Metadata = {
  title: "本校排名",
  description: "一所学校在薄肌大学排名中的人数、本周新增和名次。",
  alternates: { canonical: "/ranking/school/" },
};

// SchoolPage reads the school ID from the query string, which the static export only has in the browser.
export default function Page() {
  return (
    <Suspense>
      <SchoolPage />
    </Suspense>
  );
}
