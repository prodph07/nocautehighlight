require('dotenv').config({ path: 'e:/APPHIGHNOCAUTE/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const testCode = 'TEST_TICKET_555';
  
  // Clean up
  await supabase.from('coupons').delete().eq('code', testCode);
  
  // Insert
  const { data: ins, error: insErr } = await supabase.from('coupons').insert({
    code: testCode,
    discount_percentage: 15,
    max_uses: 1,
    current_uses: 0,
    active: true
  }).select('id').single();
  
  if (insErr) {
    console.error('Insert error:', insErr);
    return;
  }
  
  const cId = ins.id;
  
  // Call RPC
  const { data: rpcData, error: rpcErr } = await supabase.rpc('increment_coupon_uses', { p_coupon_id: cId });
  
  // Check after
  const { data: c2 } = await supabase.from('coupons').select('current_uses').eq('id', cId).single();
  
  // Write result
  fs.writeFileSync('e:/APPHIGHNOCAUTE/coupon_test_result_final.txt', JSON.stringify({
    rpcError: rpcErr,
    after: c2.current_uses
  }));
}
run();
