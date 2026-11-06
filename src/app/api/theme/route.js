import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Theme from '@/models/Theme';
import {
  COLOR_TOKENS,
  DEFAULT_THEME,
  isFontKey,
  isHexColor,
  normalizeTheme,
} from '@/lib/themeTokens';
import jwt from 'jsonwebtoken';

async function verifyAdminToken(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return { isValid: false, error: 'No token provided' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return { isValid: false, error: 'Admin access required' };
    }

    return { isValid: true, userId: decoded.id };
  } catch {
    return { isValid: false, error: 'Invalid token' };
  }
}

// GET - current theme (public, the layout reads this on every render)
export async function GET() {
  try {
    await connectToDatabase();
    const theme = await Theme.findOne({}).lean();

    // normalizeTheme fills in any token added since the document was saved,
    // so an old 2-colour theme still returns a complete payload.
    return NextResponse.json({ success: true, data: normalizeTheme(theme) });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json({ success: true, data: DEFAULT_THEME });
  }
}

// PUT - update theme (admin only, singleton)
export async function PUT(request) {
  try {
    await connectToDatabase();

    const tokenVerification = await verifyAdminToken(request);
    if (!tokenVerification.isValid) {
      return NextResponse.json(
        { success: false, message: tokenVerification.error },
        { status: 401 }
      );
    }

    const body = await request.json();

    // These values are interpolated into a <style> tag, so every field is
    // validated here rather than trusting the client. Only known keys are
    // copied across — anything else in the body is ignored.
    const update = {};

    for (const token of COLOR_TOKENS) {
      const value = body[token.key];
      if (value === undefined) continue;
      if (!isHexColor(value)) {
        return NextResponse.json(
          {
            success: false,
            message: `${token.label} must be a 6-digit hex value, e.g. ${token.default}`,
          },
          { status: 400 }
        );
      }
      update[token.key] = value.toUpperCase();
    }

    for (const field of ['fontBody', 'fontHeading']) {
      const value = body[field];
      if (value === undefined) continue;
      if (!isFontKey(value)) {
        return NextResponse.json(
          { success: false, message: `"${value}" is not an available font` },
          { status: 400 }
        );
      }
      update[field] = value;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nothing to update' },
        { status: 400 }
      );
    }

    const theme = await Theme.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: 'Theme updated successfully',
      data: normalizeTheme(theme),
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update theme' },
      { status: 500 }
    );
  }
}
