import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteClientContactRequest {
  email: string;
  contactId: string;
  clientId: string;
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

    const supabasePasswordCheck = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email, contactId, clientId, password }: InviteClientContactRequest = await req.json();

    console.log('Inviting client contact:', { email, contactId, clientId });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify password
    const { data: authData, error: authError } = await supabasePasswordCheck.auth.signInWithPassword({
      email: user.email!,
      password: password
    });

    if (authError || !authData.user) {
      throw new Error('Senha incorreta');
    }

    // Create user invitation
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `https://portal.camaleon.com.br/signup?email=${encodeURIComponent(email)}`,
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

    // Update crm_contacts with client_user_id
    const { error: updateContactError } = await supabaseAdmin
      .from('crm_contacts')
      .update({ client_user_id: userId })
      .eq('id', contactId);

    if (updateContactError) {
      console.error('Error updating contact:', updateContactError);
      throw updateContactError;
    }

    // Create client_user_role entry
    const { error: roleError } = await supabaseAdmin
      .from('client_user_role')
      .insert({
        client_user_id: userId,
        email: email,
        role: 'admin',
      });

    if (roleError) {
      console.error('Error creating client user role:', roleError);
      throw roleError;
    }

    console.log('Client contact invited successfully');

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
    console.error('Error in invite-client-contact function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao enviar convite',
        details: error.toString()
      }),
      {
        status: error.message === 'Senha incorreta' ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
