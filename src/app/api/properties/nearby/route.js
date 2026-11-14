import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';
import { BANGALORE_LOCATIONS, getNearbyLocations } from '@/utils/locations';

/**
 * Properties in and around a lead's interested location, grouped by locality.
 *
 * Powers the "Nearby" tab a caller uses mid-call: the lead wants HSR Layout,
 * this surfaces HSR Layout plus Sarjapura / Koramangala / Electronic City so
 * the caller always has something to offer.
 *
 * Adjacency comes from the hand-curated `nearby` lists in
 * src/utils/locations.js rather than map distance, so the grouping reflects
 * how buyers actually think about Bangalore areas.
 */

// A lead's location is free text ("HSR Layout, Bangalore", "hsr layout").
// Match it against the locality graph by looking for a known name inside it.
function resolveLocalityKey(input) {
  if (!input) return null;
  const haystack = input.toLowerCase();

  const matches = Object.entries(BANGALORE_LOCATIONS)
    .filter(([key, { name }]) =>
      haystack.includes(name.toLowerCase()) || haystack.includes(key.replace(/-/g, ' '))
    )
    // Longest name wins, so "JP Nagar" is not shadowed by a shorter overlap.
    .sort((a, b) => b[1].name.length - a[1].name.length);

  return matches.length > 0 ? matches[0][0] : null;
}

// "electronic-city" -> "Electronic City"
function toDisplayName(key) {
  return key
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const APPROVED = {
  $or: [{ status: 'approved' }, { status: { $exists: false } }],
};

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const limitPer = Math.min(parseInt(searchParams.get('limitPer')) || 6, 20);

    if (!location) {
      return NextResponse.json(
        { success: false, message: 'A location is required' },
        { status: 400 }
      );
    }

    const key = resolveLocalityKey(location);

    // Unrecognised area: fall back to a plain text match so the caller still
    // sees something rather than an empty tab.
    if (!key) {
      const properties = await Property.find({
        $and: [APPROVED, { location: { $regex: location.split(',')[0].trim(), $options: 'i' } }],
      })
        .sort({ createdAt: -1 })
        .limit(limitPer)
        .lean();

      return NextResponse.json({
        success: true,
        matchedLocality: null,
        groups: properties.length
          ? [{ locality: location, isExact: true, count: properties.length, properties }]
          : [],
      });
    }

    const keys = [key, ...getNearbyLocations(key)];

    const groups = await Promise.all(
      keys.map(async (k) => {
        // Around 20 of the curated `nearby` entries have no locality record of
        // their own (bagalur, brookefield, kundalahalli, …). Those are still
        // real areas worth searching, so derive a display name from the key
        // instead of dropping them.
        const name = BANGALORE_LOCATIONS[k]?.name || toDisplayName(k);

        const properties = await Property.find({
          $and: [APPROVED, { location: { $regex: name, $options: 'i' } }],
        })
          .sort({ createdAt: -1 })
          .limit(limitPer)
          .lean();

        return {
          locality: name,
          isExact: k === key,
          count: properties.length,
          properties,
        };
      })
    );

    return NextResponse.json({
      success: true,
      matchedLocality: BANGALORE_LOCATIONS[key].name,
      // Keep the lead's own locality first, then the areas with stock.
      groups: groups.filter((g) => g && g.count > 0),
    });
  } catch (error) {
    console.error('Nearby properties error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
