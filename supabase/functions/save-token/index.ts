import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define CORS headers for preflight and response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('🚀 [Edge Function] Save-token function initializing...');

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('✅ [Edge Function] Handled OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🟢 [Edge Function] Received request:', { method: req.method });
    const { token, userId, platform, deviceInfo } = await req.json();
    console.log('📦 [Edge Function] Request body:', { token, userId, platform, deviceInfo });

    if (!userId || !token || !platform) {
      throw new Error('Missing required parameters: userId, token, and platform are required.');
    }

    // Create a Supabase client with the service_role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('🔑 [Edge Function] Supabase admin client created.');

    // Check if the token already exists for the user
    const { data: existingToken, error: existingTokenError } = await supabaseAdmin
      .from('user_push_tokens')
      .select('id')
      .eq('token', token)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingTokenError) {
      console.error('❌ [Edge Function] Error checking for existing token:', existingTokenError);
      throw existingTokenError;
    }

    if (existingToken) {
      console.log('🔄 [Edge Function] Token exists. Updating...');
      const { error: updateError } = await supabaseAdmin
        .from('user_push_tokens')
        .update({
          platform,
          device_info: deviceInfo || {},
          is_active: true,
          last_used: new Date().toISOString(),
        })
        .eq('id', existingToken.id);

      if (updateError) {
        console.error('❌ [Edge Function] Error updating token:', updateError);
        throw updateError;
      }
      console.log('✅ [Edge Function] Token updated successfully.');
    } else {
      console.log('📝 [Edge Function] Token does not exist. Creating...');
      const { error: insertError } = await supabaseAdmin.from('user_push_tokens').insert({
        user_id: userId,
        token,
        platform,
        device_info: deviceInfo || {},
        is_active: true,
      });

      if (insertError) {
        console.error('❌ [Edge Function] Error creating token:', insertError);
        throw insertError;
      }
      console.log('✅ [Edge Function] Token created successfully.');
    }

    return new Response(JSON.stringify({ success: true, message: 'Token saved successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('🔥 [Edge Function] An unexpected error occurred:', err);
    return new Response(JSON.stringify({ success: false, error: err?.message ?? 'An unknown error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});