import { Poppins } from 'next/font/google';

// Add Poppins font instead of Geist Mono for better readability
export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap", // Ensures text is visible during webfont load
});
