require('dotenv').config({ path: 'e:/APPHIGHNOCAUTE/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const adminSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
const anonSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const testCode = 'TEST_TICKET_666';
  
  await adminSupabase.from('coupons').delete().eq('code', testCode);
  
  const { data: ins, error: insErr } = await adminSupabase.from('coupons').insert({
    code: testCode,
    discount_percentage: 15,
    max_uses: 1,
    current_uses: 0,
    active: true
  }).select('id').single();
  
  if (insErr) {
    fs.writeFileSync('e:/APPHIGHNOCAUTE/coupon_test_result_final.txt', 'Insert error: ' + JSON.stringify(insErr));
    return;
  }
  
  const cId = ins.id;
  
  // Call RPC as anon user (simulating frontend)
  const { data: rpcData, error: rpcErr } = await anonSupabase.rpc('increment_coupon_uses', { p_coupon_id: cId });
  
  // Check after as admin
  const { data: c2 } = await adminSupabase.from('coupons').select('current_uses').eq('id', cId).single();
  
  fs.writeFileSync('e:/APPHIGHNOCAUTE/coupon_test_result_final.txt', JSON.stringify({
    rpcError: rpcErr,
    after: c2.current_uses
  }));
}
run();
