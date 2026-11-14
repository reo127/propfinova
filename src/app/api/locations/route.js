import { NextResponse } from 'next/server';
import { getAllLocations } from '@/utils/locations';

/**
 * The locality dropdown list, so the mobile app and the website read from one
 * source of truth (src/utils/locations.js) instead of each keeping a copy
 * that drifts when a new locality is added.
 */
export async function GET() {
  return NextResponse.json(
    { success: true, data: getAllLocations() },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
