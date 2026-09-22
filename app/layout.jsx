import "./globals.css";
import NavBar from "../components/NavBar";

export const metadata = {
  title: "Sharpen",
  description: "Journal, habits, and learning — for you, not for work.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#a8611f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-bg dark:bg-dbg text-ink dark:text-dink">
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-6 pb-28">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  );
}
