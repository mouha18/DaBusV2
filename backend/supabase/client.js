"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || 'https://zqjbgxzzbqurmtdjwcik.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxamJneHp6YnF1cm10ZGp3Y2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDczOTIzMSwiZXhwIjoyMDg2MzE1MjMxfQ.aNBOwTsCzPcT0gkN-mUZq9nSmpjN_VQHA_ptu8aaEXw';
// Client for backend operations (service role - bypasses RLS)
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
//# sourceMappingURL=client.js.map