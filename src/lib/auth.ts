import "server-only";

import crypto from "node:crypto";

import argon2 from "argon2";
import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";

const STAFF_SESSION_COOKIE = "staff_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;
const MAX_FAILED_LOGIN_ATTEMPTS = 10;
const LOGIN_LOCK_DURATION_MS = 1000 * 60 * 15;

type SessionPayload = {
  managerId: string;
  sessionToken: string;
  expiresAt: string;
};

function getSessionSecret() {
  const secret = process.env.STAFF_SESSION_SECRET;

  if (!secret) {
    throw new Error("STAFF_SESSION_SECRET is not configured.");
  }

  return secret;
}

function signSessionToken(payload: SessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function verifySignedSessionToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest();

  const receivedSignature = Buffer.from(signature, "base64url");

  if (
    receivedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;

  if (!payload.managerId || !payload.sessionToken || !payload.expiresAt) {
    return null;
  }

  return payload;
}

async function getSessionCookieStore() {
  return cookies();
}

export async function hashManagerPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

export async function verifyManagerPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export async function createManagerSession(managerId: string) {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.managerSession.create({
    data: {
      managerId,
      sessionTokenHash: crypto.createHash("sha256").update(sessionToken).digest("hex"),
      expiresAt,
    },
  });

  const cookieStore = await getSessionCookieStore();
  cookieStore.set(STAFF_SESSION_COOKIE, signSessionToken({
    managerId,
    sessionToken,
    expiresAt: expiresAt.toISOString(),
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearManagerSession() {
  const cookieStore = await getSessionCookieStore();
  const existing = cookieStore.get(STAFF_SESSION_COOKIE)?.value;

  if (existing) {
    const payload = verifySignedSessionToken(existing);

    if (payload) {
      await prisma.managerSession.deleteMany({
        where: {
          managerId: payload.managerId,
          sessionTokenHash: crypto.createHash("sha256").update(payload.sessionToken).digest("hex"),
        },
      });
    }
  }

  cookieStore.delete(STAFF_SESSION_COOKIE);
}

export async function getAuthenticatedManager() {
  const cookieStore = await getSessionCookieStore();
  const token = cookieStore.get(STAFF_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = verifySignedSessionToken(token);

  if (!payload) {
    return null;
  }

  const expiresAt = new Date(payload.expiresAt);

  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    return null;
  }

  const session = await prisma.managerSession.findFirst({
    where: {
      managerId: payload.managerId,
      sessionTokenHash: crypto.createHash("sha256").update(payload.sessionToken).digest("hex"),
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      manager: true,
    },
  });

  if (!session) {
    return null;
  }

  return session.manager;
}

export async function recordFailedManagerLogin(managerId: string) {
  const manager = await prisma.managerAccount.findUnique({
    where: {
      id: managerId,
    },
    select: {
      failedLoginAttempts: true,
    },
  });

  if (!manager) {
    return {
      locked: false,
    };
  }

  const nextFailedAttempts = manager.failedLoginAttempts + 1;
  const shouldLock = nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;

  await prisma.managerAccount.update({
    where: {
      id: managerId,
    },
    data: {
      failedLoginAttempts: nextFailedAttempts,
      lockedUntil: shouldLock ? new Date(Date.now() + LOGIN_LOCK_DURATION_MS) : null,
    },
  });

  return {
    locked: shouldLock,
  };
}

export async function clearManagerLoginFailures(managerId: string) {
  await prisma.managerAccount.update({
    where: {
      id: managerId,
    },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

export function isManagerLoginLocked(lockedUntil: Date | null | undefined) {
  return Boolean(lockedUntil && lockedUntil > new Date());
}

export async function requireAuthenticatedManager() {
  const manager = await getAuthenticatedManager();

  if (!manager) {
    const headerStore = await headers();
    const pathname = headerStore.get("x-openclaw-pathname") ?? headerStore.get("x-pathname") ?? "/staff";
    const search = headerStore.get("x-openclaw-search") ?? headerStore.get("x-search") ?? "";
    const nextPath = pathname.startsWith("/staff") ? `${pathname}${search}` : "/staff";

    const { redirect } = await import("next/navigation");
    redirect(`/staff/login?next=${encodeURIComponent(nextPath)}`);
  }

  return manager;
}
