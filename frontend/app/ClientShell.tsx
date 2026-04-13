"use client";

import { usePathname } from "next/navigation";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import BackendBanner from "@/components/BackendBanner";
import NavBar from "@/components/NavBar";

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <>{children}</>;
  }

  const hideNav = pathname === "/profile" || pathname === "/results";

  return (
    <>
      <BackgroundOrbs />
      <div className="relative" style={{ zIndex: 1 }}>
        <BackendBanner />
        {!hideNav && <NavBar />}
        <main>{children}</main>
      </div>
    </>
  );
}
