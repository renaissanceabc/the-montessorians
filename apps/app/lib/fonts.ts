import { Geist, Geist_Mono, Instrument_Serif, Playfair_Display } from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

const instrumentSerif = Instrument_Serif({
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
});

export const fonts = `${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${playfairDisplay.variable}`;
