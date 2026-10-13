import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Only used for small identifier labels, so it isn't worth a preload.
const geistMono = Geist_Mono({
  preload: false,
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const instrumentSerif = Instrument_Serif({
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
});

export const fonts = `${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`;
