const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function seed() {
    console.log('🌱 Seeding Employee Role and User...');

    try {
        // 1. Create/Update Employee Role
        const employeePermissions = {
            viewDashboard: false, // Restricted
            viewInventory: true,
            updateInventory: true, // For scanning
            viewAttendance: false,  // Restricted by backend
            manageAttendance: false,
            createPurchaseRequest: true,
            viewNotifications: false // Restricted
        };

        let { data: role } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'Employee')
            .single();

        if (!role) {
            console.log('Creating Employee role...');
            const { data, error } = await supabase
                .from('roles')
                .insert({ name: 'Employee', permissions: employeePermissions })
                .select()
                .single();
            if (error) throw error;
            role = data;
        } else {
            console.log('Updating Employee role permissions...');
            await supabase
                .from('roles')
                .update({ permissions: employeePermissions })
                .eq('id', role.id);
        }
        console.log('✅ Role set up:', role.id);

        // 2. Create Employee User
        const email = 'employee@breeze.com';
        const password = 'employee123';

        // Check if auth user exists
        const { data: { users } } = await supabase.auth.admin.listUsers();
        let user = users.find(u => u.email === email);

        if (!user) {
            console.log('Creating auth user...');
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name: 'Employee User' }
            });
            if (error) throw error;
            user = data.user;
        }
        console.log('✅ Auth user:', user.id);

        // 3. Create/Update Employee Profile
        const { data: profile } = await supabase
            .from('employees')
            .select('id')
            .eq('email', email)
            .single();

        if (!profile) {
            console.log('Creating employee profile...');
            const { error } = await supabase.from('employees').insert({
                id: user.id,
                name: 'Employee Test',
                email: email,
                // role_id: role.id, // Column missing in DB
                position: 'Employee', // Use position as role marker
                department: 'Operations',
                status: 'active'
            });
            if (error) throw error;
        } else {
            // Update position to act as role
            await supabase
                .from('employees')
                .update({ position: 'Employee' })
                .eq('id', user.id);
        }
        console.log('✅ Employee profile set up');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

seed();
