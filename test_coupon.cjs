require('dotenv').config({ path: 'e:/APPHIGHNOCAUTE/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: coupons, error: err } = await supabase.from('coupons').select('*').limit(1);
  if (err || !coupons || coupons.length === 0) {
    console.log('No coupons found or error:', err);
    return;
  }
  const coupon = coupons[0];
  console.log('Testing increment for coupon:', coupon.code, 'max:', coupon.max_uses, 'current:', coupon.current_uses);

  const { data, error } = await supabase.rpc('increment_coupon_uses', { p_coupon_id: coupon.id });
  console.log('RPC check:', { data, error });

  const { data: c2 } = await supabase.from('coupons').select('*').eq('id', coupon.id).single();
  console.log('After increment:', 'max:', c2.max_uses, 'current:', c2.current_uses);
  
  if (c2.current_uses !== coupon.current_uses) {
      await supabase.from('coupons').update({ current_uses: coupon.current_uses }).eq('id', coupon.id);
      console.log('Reset coupon to', coupon.current_uses);
  }
}
run();
