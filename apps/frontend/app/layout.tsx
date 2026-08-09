import "./globals.css";
import React from "react";

export const metadata = {
  title: "StellarPass",
  description: "The open-source event ticketing platform powered by the Stellar blockchain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-primary">StellarPass <span className="text-sm font-normal text-gray-500">MVP Prototype</span></h1>
              <nav className="space-x-4">
                <a href="/" className="text-gray-600 hover:text-gray-900">Discover</a>
                <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                <a href="/verify" className="text-gray-600 hover:text-gray-900">Verify</a>
              </nav>
            </div>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="bg-gray-100 py-6 text-center text-gray-500 text-sm">
            <p>StellarPass is an open-source prototype running on Soroban Testnet.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
