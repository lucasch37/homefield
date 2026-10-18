import ReportExplorer from "@/components/report-explorer";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = {
  title: "Search — homefield",
};

export default function Explorer() {
  return <ReportExplorer />;
}
