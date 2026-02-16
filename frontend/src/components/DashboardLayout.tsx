"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useNear } from "@/context/NearContext";
import {
    Shield,
    LayoutDashboard,
    PlusCircle,
    LogOut,
    Wallet,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/create", label: "Create Wallet", icon: PlusCircle },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { accountId, isSignedIn, signIn, signOut } = useNear();
    const [mobileOpen, setMobileOpen] = useState(false);

    if (!isSignedIn) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-4">
                <Image
                    src="/logo.png"
                    alt="Iron Wallet"
                    width={56}
                    height={56}
                    className="rounded-2xl"
                />
                <h2 className="mt-5 text-xl font-bold text-[#121312]">
                    Connect your wallet
                </h2>
                <p className="mt-2 text-sm text-[#636669]">
                    Sign in with your NEAR wallet to access the dashboard.
                </p>
                <button
                    onClick={signIn}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#12ff80] px-6 py-3 text-sm font-semibold text-[#121312] shadow-lg shadow-[#12ff8030] transition-all hover:bg-[#0ee872] hover:shadow-xl hover:shadow-[#12ff8040]"
                >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                </button>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#fafafa]">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#e8e8e8] bg-white transition-transform lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Logo */}
                <div className="flex h-16 items-center gap-2.5 border-b border-[#e8e8e8] px-5">
                    <Link href="/" className="flex items-center gap-2.5">
                        <Image
                            src="/logo.png"
                            alt="Iron Wallet"
                            width={32}
                            height={32}
                            className="rounded-lg"
                        />
                        <span className="text-base font-bold text-[#121312] tracking-tight">
                            Iron{" "}
                            <span className="font-normal text-[#636669]">{"{Wallet}"}</span>
                        </span>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="ml-auto rounded-md p-1 text-[#636669] lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Connected account */}
                <div className="border-b border-[#e8e8e8] px-4 py-3">
                    <div className="flex items-center gap-2 rounded-xl border border-[#e2e2e2] bg-[#f8fdf8] px-3 py-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#12ff8018]">
                            <Wallet className="h-3.5 w-3.5 text-[#121312]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-semibold text-[#121312]">
                                {accountId}
                            </p>
                            <p className="text-[10px] text-[#636669]">NEAR Testnet</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
                    <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[#636669]/60">
                        Menu
                    </p>
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                            ? "bg-[#12ff8018] text-[#121312]"
                                            : "text-[#636669] hover:bg-[#f4f4f4] hover:text-[#121312]"
                                        }`}
                                >
                                    <item.icon
                                        className={`h-[18px] w-[18px] ${isActive ? "text-[#121312]" : ""}`}
                                    />
                                    {item.label}
                                    {isActive && (
                                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#12ff80]" />
                                    )}
                                </Link>
                            );
                        })}

                        {/* Wallet sub-links */}
                        {pathname.startsWith("/wallet/") && (
                            <div className="ml-3 mt-1 border-l-2 border-[#12ff80]/30 pl-3">
                                <div className="flex items-center gap-2 rounded-xl bg-[#12ff8018] px-3 py-2 text-sm font-medium text-[#121312]">
                                    <Shield className="h-4 w-4 text-[#121312]" />
                                    <span className="truncate">
                                        {decodeURIComponent(
                                            pathname.split("/wallet/")[1]?.split("/")[0] || "Wallet"
                                        )}
                                    </span>
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#12ff80]" />
                                </div>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Footer */}
                <div className="border-t border-[#e8e8e8] p-4">
                    <button
                        onClick={signOut}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[#636669] transition-colors hover:bg-[#f4f4f4] hover:text-[#121312]"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col min-w-0">
                {/* Mobile header */}
                <header className="flex h-14 items-center gap-3 border-b border-[#e8e8e8] bg-white/80 backdrop-blur-xl px-4 lg:hidden">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="rounded-lg p-1.5 text-[#636669] hover:bg-[#f4f4f4]"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="Iron Wallet"
                            width={28}
                            height={28}
                            className="rounded-lg"
                        />
                        <span className="text-sm font-bold text-[#121312]">
                            Iron{" "}
                            <span className="font-normal text-[#636669]">{"{Wallet}"}</span>
                        </span>
                    </Link>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
