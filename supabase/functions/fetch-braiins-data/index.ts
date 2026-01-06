import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Worker {
  name: string;
  hashrate: number;
  status: string;
}

interface BraiinsWorker {
  worker_name: string;
  hashrate_5m: number;
  hashrate_1h: number;
  hashrate_24h: number;
  last_share: string;
  state: string;
}

interface BraiinsResponse {
  workers: BraiinsWorker[];
  hashrate_5m: number;
  current_balance: string;
  today_reward: string;
  estimated_reward: string;
  error?: string;
  details?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing authorization header',
          workers: [], 
          hashrate_5m: 0,
          current_balance: "0",
          today_reward: "0",
          estimated_reward: "0"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing env vars - URL:', !!supabaseUrl, 'Service Key:', !!supabaseServiceKey);
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Missing Supabase configuration',
          workers: [], 
          hashrate_5m: 0,
          current_balance: "0",
          today_reward: "0",
          estimated_reward: "0"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: authError?.message,
          workers: [], 
          hashrate_5m: 0,
          current_balance: "0",
          today_reward: "0",
          estimated_reward: "0"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select('braiins_api_token, braiins_username')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('User error:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'User not found', 
          details: userError?.message,
          workers: [], 
          hashrate_5m: 0,
          current_balance: "0",
          today_reward: "0",
          estimated_reward: "0"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { braiins_api_token, braiins_username } = userData;

    if (!braiins_api_token || !braiins_username) {
      return new Response(
        JSON.stringify({ 
          error: 'Braiins API not configured',
          workers: [], 
          hashrate_5m: 0,
          current_balance: "0",
          today_reward: "0",
          estimated_reward: "0"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Fetching Braiins data for user:', braiins_username);
    console.log('API Token length:', braiins_api_token?.length);

    // Fetch profile data
    const profileResponse = await fetch(
      `https://pool.braiins.com/accounts/profile/json/${braiins_username}/`,
      {
        headers: {
          'SlushPool-Auth-Token': braiins_api_token,
        },
      }
    );

    console.log('Profile response status:', profileResponse.status);
    console.log('Profile response content-type:', profileResponse.headers.get('content-type'));

    const profileText = await profileResponse.text();
    console.log('Profile response text (first 200 chars):', profileText.substring(0, 200));

    // Check if response is HTML (error page)
    if (profileText.startsWith('<!DOCTYPE') || profileText.startsWith('<html') || profileText.includes('<!DOCTYPE html>')) {
      console.error('Braiins returned HTML error page');
      return new Response(
        JSON.stringify({ 
          error: 'Braiins authentication failed',
          details: 'Invalid API token or username. Please check your Braiins credentials.',
          workers: [], 
          hashrate_5m: 0,
          current_balance: "0",
          today_reward: "0",
          estimated_reward: "0"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!profileResponse.ok) {
      console.error('Braiins profile error:', profileText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch from Braiins API',
          details: `Status: ${profileResponse.status}`,
          workers: [], 
          hashrate_5m: 0,
          current_balance: "0",
          today_reward: "0",
          estimated_reward: "0"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let profileData;
    try {
      profileData = JSON.parse(profileText);
    } catch (parseError) {
      console.error('Failed to parse profile JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response from Braiins API',
          details: 'Response was not valid JSON',
          workers: [], 
          hashrate_5m: 0,
          current_balance: "0",
          today_reward: "0",
          estimated_reward: "0"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    console.log('Profile data:', JSON.stringify(profileData, null, 2));

    // Fetch workers data
    const workersResponse = await fetch(
      `https://pool.braiins.com/accounts/workers/json/${braiins_username}/`,
      {
        headers: {
          'SlushPool-Auth-Token': braiins_api_token,
        },
      }
    );

    let workers: BraiinsWorker[] = [];

    if (workersResponse.ok) {
      const workersData = await workersResponse.json();
      console.log('Workers data:', JSON.stringify(workersData, null, 2));
      
      if (workersData && typeof workersData === 'object') {
        for (const [workerName, workerData] of Object.entries(workersData)) {
          if (workerName !== 'ok' && workerData && typeof workerData === 'object') {
            const data = workerData as any;
            
            workers.push({
              worker_name: workerName,
              hashrate_5m: data.hash_rate_5m || 0,
              hashrate_1h: data.hash_rate_1h || data.hash_rate_60m || 0,
              hashrate_24h: data.hash_rate_24h || 0,
              last_share: data.last_share || '',
              state: data.state || 'unknown',
            });
          }
        }
      }
    }

    // Extract reward data from profile
    const btcData = profileData?.btc || {};
    const hashrate5m = btcData.hash_rate_5m || btcData.hash_rate_scoring || 0;
    const confirmedReward = btcData.confirmed_reward || 0;
    const unconfirmedReward = btcData.unconfirmed_reward || 0;
    const estimatedReward = btcData.estimated_reward || 0;
    
    // Today's reward - try to calculate from recent data or use estimated
    const todayReward = btcData.today_reward || (estimatedReward / 24) || 0;

    const response: BraiinsResponse = {
      workers,
      hashrate_5m: hashrate5m, // Keep in Gh/s, client will convert to TH/s
      current_balance: (confirmedReward + unconfirmedReward).toString(),
      today_reward: todayReward.toString(),
      estimated_reward: estimatedReward.toString(),
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        workers: [], 
        hashrate_5m: 0,
        current_balance: "0",
        today_reward: "0",
        estimated_reward: "0"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
