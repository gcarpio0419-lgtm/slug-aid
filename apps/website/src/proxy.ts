import { NextRequest, NextResponse } from "next/server";
export const config = {
    matcher: "/((?!_next/static|_next/image|foodIcon\\.svg$).*)",
};
export default function proxy(request: NextRequest) {
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";

    if (!isMaintenanceMode) {
        return NextResponse.next();
    }

    const pathname = request.nextUrl.pathname;

    if (pathname === "/maintenance") {
        return NextResponse.next();
    }

    if (pathname === "/uploader" || pathname.startsWith("/uploader/")) {
        return NextResponse.next();
    }

    const maintenanceUrl = new URL("/maintenance", request.url);

    return NextResponse.redirect(maintenanceUrl);
}