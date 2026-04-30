import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('category')
      .order('name_id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('menu')
      .insert({ ...body, restaurant_id: RESTAURANT_ID })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
