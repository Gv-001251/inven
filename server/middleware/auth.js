const supabase = require('../config/supabase');

const authenticateSupabaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // ✅ Verify Supabase token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('❌ Invalid Supabase token:', error?.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    console.log('✅ Token verified for user:', user.email);
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { authenticateSupabaseToken };
