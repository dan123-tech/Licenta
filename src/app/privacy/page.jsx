import LegalDocPage from "@/components/legal/LegalDocPage";

export const metadata = {
  title: "Privacy Policy | FleetShare",
  description: "How FleetShare handles personal data for the company car sharing platform.",
};

export default function PrivacyPage() {
  return <LegalDocPage prefix="legal.privacy" />;
}
