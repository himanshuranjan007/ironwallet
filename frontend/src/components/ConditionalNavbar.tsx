"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export function ConditionalNavbar() {
    const pathname = usePathname();

    // Don't show the dark Navbar on the landing page — it has its own LandingNavbar
    if (pathname === "/") return null;

    return <Navbar />;
}
