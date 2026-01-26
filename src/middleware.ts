import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAuthRoute = request.nextUrl.pathname === "/"
    const isProtectedRoute =
        request.nextUrl.pathname.startsWith("/patient") ||
        request.nextUrl.pathname.startsWith("/pharmacy")

    // 1. If trying to access protected route without user -> Redirect to login
    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    // 2. If at login page and ALREADY logged in -> Auto-redirect to dashboard based on role
    if (isAuthRoute && user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        if (profile) {
            const dest = profile.role === "pharmacist" ? "/pharmacy" : "/patient"
            return NextResponse.redirect(new URL(dest, request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
