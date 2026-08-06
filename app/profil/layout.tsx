import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil",
  robots: { index: false, follow: false, nocache: true }
};

export default function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
