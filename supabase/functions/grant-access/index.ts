import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GrantAccessRequest {
  email: string;
  colaboradorId: string;
  role: string;
  crmAccess: boolean;
  crmAccessLevel: string;
  wppAccess: boolean;
  password: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader }
      }
    });
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email, colaboradorId, role, crmAccess, crmAccessLevel, wppAccess, password }: GrantAccessRequest = await req.json();

    console.log('Granting access for:', { email, colaboradorId, role });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: authData, error: authError } = await supabaseUser.auth.signInWithPassword({
      email: user.email!,
      password: password
    });

    if (authError || !authData.user) {
      throw new Error('Senha incorreta');
    }

    // Create user invitation
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `https://admin.camaleon.com.br/signup?email=${encodeURIComponent(email)}`,
    });

    if (inviteError) {
      console.error('Error inviting user:', inviteError);
      throw inviteError;
    }

    if (!inviteData.user) {
      throw new Error('No user returned from invite');
    }

    const userId = inviteData.user.id;
    console.log('User invited successfully:', userId);

    // Update colaborador with user_id
    const { error: updateError } = await supabaseAdmin
      .from('colaborador')
      .update({ user_id: userId })
      .eq('id_colaborador', colaboradorId);

    if (updateError) {
      console.error('Error updating colaborador:', updateError);
      throw updateError;
    }

    // Create user_roles entry
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        crm_access: crmAccess,
        crm_access_level: crmAccessLevel,
        wpp_acess: wppAccess,
      });

    if (rolesError) {
      console.error('Error creating user roles:', rolesError);
      throw rolesError;
    }

    console.log('Access granted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        message: 'Convite enviado com sucesso' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in grant-access function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao conceder acesso',
        details: error.toString()
      }),
      {
        status: error.message === 'Senha incorreta' ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
