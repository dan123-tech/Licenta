import LegalDocPage from "@/components/legal/LegalDocPage";

export const metadata = {
  title: "Terms and Conditions | FleetShare",
  description: "Terms of use for the FleetShare company car sharing platform.",
};

export default function TermsPage() {
  return <LegalDocPage prefix="legal.terms" />;
}
