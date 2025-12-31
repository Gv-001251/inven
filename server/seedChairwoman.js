const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function seedChairwoman() {
    console.log('🌱 Seeding Chairwoman User...');

    try {
        // 1. Verify Chairwoman Role exists (fullAccess: true is in main seed)
        let { data: role } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'Chairwoman')
            .single();

        if (!role) {
            console.log('Creating Chairwoman role...');
            const { data, error } = await supabase
                .from('roles')
                .insert({ name: 'Chairwoman', permissions: { fullAccess: true } })
                .select()
                .single();
            if (error) throw error;
            role = data;
        }
        console.log('✅ Chairwoman role ID:', role.id);

        // 2. Create Chairwoman Auth User
        const email = 'chairwoman@breeze.com';
        const password = 'chairwoman123';

        const { data: { users } } = await supabase.auth.admin.listUsers();
        let user = users.find(u => u.email === email);

        if (!user) {
            console.log('Creating auth user...');
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name: 'Chairwoman User' }
            });
            if (error) throw error;
            user = data.user;
        } else {
            // Update password for existing user
            console.log('Updating password for existing user...');
            const { error } = await supabase.auth.admin.updateUserById(user.id, {
                password: password
            });
            if (error) console.error('Password update error:', error);
            else console.log('✅ Password updated successfully');
        }
        console.log('✅ Auth user ID:', user.id);

        // 3. Create/Update Employee Profile with Chairwoman position
        const { data: profile } = await supabase
            .from('employees')
            .select('id')
            .eq('email', email)
            .single();

        if (!profile) {
            console.log('Creating employee profile...');
            const { error } = await supabase.from('employees').insert({
                id: user.id,
                name: 'Chairwoman',
                email: email,
                position: 'Chairwoman', // Maps to Chairwoman role
                department: 'Executive',
                status: 'active'
            });
            if (error) throw error;
        } else {
            await supabase
                .from('employees')
                .update({ position: 'Chairwoman' })
                .eq('id', user.id);
        }
        console.log('✅ Chairwoman profile set up');

        console.log('\n📋 Mock Login Credentials:');
        console.log('  Chairwoman: chairwoman@breeze.com / chairwoman123');
        console.log('  Employee:   employee@breeze.com / employee123');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

seedChairwoman();
