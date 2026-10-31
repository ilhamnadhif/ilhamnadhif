import { Libre_Franklin } from "next/font/google";

export const franklin = Libre_Franklin({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-franklin",
  display: "swap",
});
