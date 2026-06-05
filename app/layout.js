import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "PropReel - Real Estate Video SaaS",
  description: "Turn property listings into social-ready marketing videos with Fal.ai.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
