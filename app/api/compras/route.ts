import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
// NOTE: Adjust the auth/db client to match your project (Supabase/NextAuth/Express)
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export async function GET(req: Request) {
  try {
    const supabase = createServerSupabaseClient({ req, cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*', order_items(*, product:products(*))')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}