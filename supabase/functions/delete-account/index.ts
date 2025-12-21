import { createClient } from 'npm:@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1️⃣ Read Authorization header safely
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // 2️⃣ Create ANON client to validate user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        auth: { persistSession: false },
      }
    )

    // 3️⃣ Get logged-in user
    const { data: { user }, error: authError } =
      await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // 4️⃣ Create ADMIN client
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    // 5️⃣ Delete user
    const { error: deleteError } =
      await admin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      throw deleteError
    }

    // 6️⃣ Success response
    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted' }),
      { status: 200, headers: corsHeaders }
    )

  } catch (err) {
    console.error('Delete account error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to delete account' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
