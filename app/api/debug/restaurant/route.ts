import { NextResponse } from 'next/server'
import { restaurantDb } from '@/lib/db'

export async function GET() {
  try {
    const restaurant = restaurantDb.get()
    return NextResponse.json({ restaurant })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
