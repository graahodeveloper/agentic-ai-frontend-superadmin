import type { Metadata } from "next";
import "./globals.css";
import { poppins } from "./fonts";
// Importing AWS Amplify configuration
import { Amplify } from 'aws-amplify';
import  amplifyConfig  from "@/aws-exports"
import { ReduxProvider } from './providers/providers';
import { AmplifyProvider } from './providers/amplify-provider';

Amplify.configure(amplifyConfig);




export const metadata: Metadata = {
  title: "Graaho AI Agent",
  description: "AI Agent Platform for Business Automation",
  icons: {
    icon: "/icon.png", // public/favicon.ico
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={poppins.className}
      >
         <ReduxProvider>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
