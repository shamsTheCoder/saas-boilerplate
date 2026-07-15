"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setAccessToken, clearAccessToken } from "@/lib/auth";
import { ROUTES } from "@/constants/routes";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth.schemas";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

/**
 * Flat state type — compatible with useFormState in React 18.
 * Discriminated unions cause TypeScript errors with useFormState's overloads.
 */
export type FormState = {
  success: boolean;
  error: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const INITIAL_STATE: FormState = { success: false, error: "" };

// ─── Helper ────────────────────────────────────────────────────────────────

import { headers } from "next/headers";

async function apiPost(path: string, body: unknown): Promise<Response> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");

  return fetch(`${API_URL}/api/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(forwardedFor && { "x-forwarded-for": forwardedFor }),
      ...(realIp && { "x-real-ip": realIp }),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

// ─── Login ────────────────────────────────────────────────────────────────

export async function loginAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const res = await apiPost("/auth/login", parsed.data);
    const body = (await res.json()) as { accessToken?: string };

    if (!res.ok) {
      const msg =
        res.status === 403
          ? "Please verify your email before logging in."
          : "Invalid email or password.";
      return { success: false, error: msg };
    }

    // Store the access token in an httpOnly cookie on the Next.js server
    await setAccessToken(body.accessToken!);

    // Forward the NestJS refresh_token cookie to the browser
    const setCookieHeader = res.headers.get("set-cookie");
    if (setCookieHeader) {
      const cookieStore = await cookies();
      const match = setCookieHeader.match(/refresh_token=([^;]+)/);
      if (match) {
        const isProduction = process.env.NODE_ENV === "production";
        cookieStore.set("refresh_token", match[1], {
          httpOnly: true,
          secure: isProduction,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        });
      }
    }
  } catch {
    return {
      success: false,
      error: "Unable to connect to the server. Please try again.",
    };
  }

  // redirect() must be called outside try/catch — it throws a special Next.js error
  redirect(ROUTES.ONBOARDING);
}

// ─── Register ─────────────────────────────────────────────────────────────

export async function registerAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = {
    name: formData.get("name") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const res = await apiPost("/auth/register", parsed.data);

    if (!res.ok) {
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    }

    // Automatically log the user in after successful registration
    // NOTE: loginAction's redirect() throws a special Next.js error — we must NOT catch it
  } catch {
    return {
      success: false,
      error: "Unable to connect to the server. Please try again.",
    };
  }

  // Call loginAction OUTSIDE of try/catch so its redirect() propagates correctly
  return loginAction(prevState, formData);
}

// ─── Logout ───────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const allCookies = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // BUG FIX: We MUST call the backend logout even if accessToken is missing,
  // otherwise the refresh_token is left alive in the database for 7 days!
  // The backend /logout endpoint is @Public() and only needs the cookie.
  try {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        Cookie: allCookies,
      },
      cache: "no-store",
    });
  } catch {
    // Best-effort — clear local cookies regardless
  }

  await clearAccessToken();
  cookieStore.delete("refresh_token");
  redirect(ROUTES.LOGIN);
}

// ─── Forgot Password ──────────────────────────────────────────────────────

export async function forgotPasswordAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { success: false, error: "Please enter a valid email address." };
  }

  try {
    const res = await apiPost("/auth/forgot-password", parsed.data);
    const body = (await res.json()) as { message?: string };
    return { success: true, error: "", message: body.message };
  } catch {
    return {
      success: false,
      error: "Unable to connect to the server. Please try again.",
    };
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────

export async function resetPasswordAction(
  token: string,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const res = await apiPost("/auth/reset-password", {
      token,
      password: parsed.data.password,
    });
    const body = (await res.json()) as { message?: string };

    if (!res.ok) {
      return {
        success: false,
        error: "Invalid or expired password reset link.",
      };
    }

    return { success: true, error: "", message: body.message };
  } catch {
    return {
      success: false,
      error: "Unable to connect to the server. Please try again.",
    };
  }
}

// ─── Verify Email ─────────────────────────────────────────────────────────

export async function verifyEmailAction(token: string): Promise<FormState> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    const body = (await res.json()) as { message?: string };

    if (!res.ok) {
      return { success: false, error: "Invalid or expired verification link." };
    }

    return { success: true, error: "", message: body.message };
  } catch {
    return {
      success: false,
      error: "Unable to connect to the server. Please try again.",
    };
  }
}
