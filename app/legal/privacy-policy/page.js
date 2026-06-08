import LegalDocument from "@/components/LegalDocument";
import MarketingNav from "@/components/MarketingNav";
import { legalDocuments } from "@/lib/legalDocuments";

export const metadata = {
  title: "Privacy Policy - PropReel",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="pr-shell min-h-screen">
      <MarketingNav />
      <section className="px-6 py-12">
        <LegalDocument document={legalDocuments.privacyPolicy} />
      </section>
    </main>
  );
}
