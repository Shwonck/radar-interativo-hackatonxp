import { AdvisorShell } from "./components/AdvisorShell";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <AdvisorShell>{children}</AdvisorShell>;
}
