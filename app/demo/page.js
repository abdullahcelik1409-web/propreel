import Script from "next/script";
import MarketingNav from "@/components/MarketingNav";
import DemoPageClient from "@/components/demo/DemoPageClient";
import { getDemoVideos, pickDemoTrackingParams } from "@/lib/marketing/demoConfig";

export const metadata = {
  title: "Viseo Demo - AI Real Estate Video Examples",
  description: "Watch public Viseo demo videos and see how listing photos become short, ready-to-post real estate videos.",
};

export default async function DemoPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const demoVideos = getDemoVideos();
  const initialTrackingParams = pickDemoTrackingParams(resolvedSearchParams || {});
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

  return (
    <>
      {gaMeasurementId && (
        <>
          <Script
            id="viseo-demo-ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { page_path: '/demo' });
              `,
            }}
          />
          <Script
            id="viseo-demo-ga4-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          />
        </>
      )}

      <div className="pr-shell min-h-screen overflow-hidden">
        <MarketingNav />
        <DemoPageClient demoVideos={demoVideos} initialTrackingParams={initialTrackingParams} />
      </div>
    </>
  );
}
