import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserProduct {
  id: string;
  user_id: string;
  product_id: string;
  daily_earning: number;
  days_remaining: number;
  total_earned: number;
  is_active: boolean;
}

interface ProcessResult {
  success: boolean;
  processed: number;
  deactivated: number;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Starting daily earnings calculation...');

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Fetch all active user products with remaining days
    // Exclude products that already received earnings today
    const { data: activeProducts, error: fetchError } = await supabase
      .from('user_products')
      .select('*')
      .eq('is_active', true)
      .gt('days_remaining', 0)
      .or(`last_earning_date.is.null,last_earning_date.neq.${today}`);

    if (fetchError) {
      console.error('Error fetching active products:', fetchError);
      throw new Error(`Failed to fetch active products: ${fetchError.message}`);
    }

    if (!activeProducts || activeProducts.length === 0) {
      console.log('No active products to process');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active products to process',
          processed: 0,
          deactivated: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Found ${activeProducts.length} active products to process`);

    const result: ProcessResult = {
      success: true,
      processed: 0,
      deactivated: 0,
      errors: [],
    };

    // Process each active product
    for (const product of activeProducts as UserProduct[]) {
      try {
        console.log(`Processing product ${product.id} for user ${product.user_id}`);

        // Calculate new values
        const newDaysRemaining = product.days_remaining - 1;
        const newTotalEarned = product.total_earned + product.daily_earning;
        const shouldDeactivate = newDaysRemaining <= 0;

        // Update user_products table
        const { error: updateProductError } = await supabase
          .from('user_products')
          .update({
            days_remaining: newDaysRemaining,
            total_earned: newTotalEarned,
            is_active: !shouldDeactivate,
            last_earning_date: today,
          })
          .eq('id', product.id);

        if (updateProductError) {
          console.error(`Error updating product ${product.id}:`, updateProductError);
          result.errors.push(`Product ${product.id}: ${updateProductError.message}`);
          continue;
        }

        // Update user's balance and withdrawable amount
        const { error: updateBalanceError } = await supabase.rpc('update_user_balance', {
          p_user_id: product.user_id,
          p_amount: product.daily_earning,
        });

        if (updateBalanceError) {
          console.error(`Error updating balance for user ${product.user_id}:`, updateBalanceError);
          result.errors.push(`User ${product.user_id} balance: ${updateBalanceError.message}`);
          continue;
        }

        // Fetch updated user balance
        const { data: userData, error: userFetchError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', product.user_id)
          .single();

        if (userFetchError || !userData) {
          console.error(`Error fetching user balance for ${product.user_id}:`, userFetchError);
          result.errors.push(`User ${product.user_id} fetch: ${userFetchError?.message || 'User not found'}`);
          continue;
        }

        // Create daily earnings record
        const { error: earningsError } = await supabase
          .from('daily_earnings')
          .insert({
            user_id: product.user_id,
            user_product_id: product.id,
            amount: product.daily_earning,
            earning_date: today,
          });

        if (earningsError) {
          console.error(`Error creating daily earnings record for user ${product.user_id}:`, earningsError);
          result.errors.push(`Daily earnings ${product.id}: ${earningsError.message}`);
          // Continue anyway as balance was already updated
        }

        // Create transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: product.user_id,
            type: 'earning',
            amount: product.daily_earning,
            balance_after: userData.balance,
            description: `Daily earnings from product investment`,
            reference_id: product.id,
          });

        if (transactionError) {
          console.error(`Error creating transaction for user ${product.user_id}:`, transactionError);
          result.errors.push(`Transaction ${product.id}: ${transactionError.message}`);
          // Continue anyway as balance was already updated
        }

        result.processed++;
        if (shouldDeactivate) {
          result.deactivated++;
          console.log(`Product ${product.id} completed and deactivated`);
        }

        console.log(`Successfully processed product ${product.id}`);
      } catch (error: any) {
        console.error(`Error processing product ${product.id}:`, error);
        result.errors.push(`Product ${product.id}: ${error.message}`);
      }
    }

    console.log('Daily earnings calculation completed');
    console.log(`Processed: ${result.processed}, Deactivated: ${result.deactivated}, Errors: ${result.errors.length}`);

    return new Response(
      JSON.stringify({
        success: result.errors.length === 0,
        message: `Processed ${result.processed} products, deactivated ${result.deactivated}`,
        processed: result.processed,
        deactivated: result.deactivated,
        errors: result.errors,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.errors.length === 0 ? 200 : 207, // 207 = Multi-Status (partial success)
      }
    );
  } catch (error: any) {
    console.error('Fatal error in daily earnings function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
