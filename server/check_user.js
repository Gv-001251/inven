const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('URL:', process.env.SUPABASE_URL ? 'Found' : 'Missing');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function check() {
    try {
        const email = 'inventory@breeze.tech';
        console.log('Checking for:', email);

        // Check Employees
        const { data: emp, error: empError } = await supabase
            .from('employees')
            .select('*')
            .eq('email', email);

        console.log('Employee record:', emp);
        if (empError) console.error('Emp Error:', empError);

        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('Auth Error:', authError);
        } else {
            const user = users.find(u => u.email === email);
            console.log('Auth user found:', user ? user.id : 'NO');
            if (user) {
                console.log('Auth User ID:', user.id);
                if (emp && emp.length > 0) {
                    console.log('Employee ID:', emp[0].id);
                    console.log('IDs Match:', user.id === emp[0].id);
                } else {
                    console.log('MISMATCH: Auth user exists but no Employee record.');
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
}

check();
