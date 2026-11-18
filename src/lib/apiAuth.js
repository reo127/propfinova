import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Bearer-token checking for route handlers.
 *
 * The same dozen lines were being re-typed in every protected route, which is
 * how /api/leads/[id] ended up shipping with no check at all. One helper makes
 * the omission visible.
 */
export function requireAuth(request, allowedRoles) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return { ok: false, status: 401, message: 'Not authorized, please login' };
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return { ok: false, status: 403, message: 'You do not have permission to do that' };
    }

    return { ok: true, user };
  } catch {
    return { ok: false, status: 401, message: 'Invalid or expired session' };
  }
}

/** Turns a failed requireAuth result into a response. */
export function authError(check) {
  return NextResponse.json(
    { success: false, message: check.message },
    { status: check.status }
  );
}

/** Reads the caller's identity without requiring one. */
export function optionalAuth(request) {
  const check = requireAuth(request);
  return check.ok ? check.user : null;
}
