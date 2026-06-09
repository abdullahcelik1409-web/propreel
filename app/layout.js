import "./globals.css";
import Providers from "@/components/Providers";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Viseo - Real Estate Video SaaS",
  description: "Turn property listings into social-ready marketing videos with Fal.ai.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
