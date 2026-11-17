import "./globals.css";
import Providers from "./components/Providers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata = {
  title: "LessGo — Ace Your Placements",
  description:
    "LessGo helps students prepare for interviews, practice DSA, follow learning roadmaps, and access free curated resources — all in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
