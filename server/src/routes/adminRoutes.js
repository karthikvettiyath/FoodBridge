const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/authMiddleware');

const checkAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ msg: 'Access denied: Admin only' });
    }
    next();
};

// @route   GET api/admin/stats
// @desc    Get system-wide statistics
// @access  Private (Admin only)
router.get('/stats', auth, checkAdmin, async (req, res) => {
    try {
        // We can use supabase .count() usually, but let's just fetch and count for MVP speed if datasets are small,
        // or use exact count queries. Supabase .select('*', { count: 'exact', head: true }) gives count.

        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: donorCount } = await supabase.from('donors').select('*', { count: 'exact', head: true });
        const { count: ngoCount } = await supabase.from('ngos').select('*', { count: 'exact', head: true });
        const { count: volunteerCount } = await supabase.from('volunteers').select('*', { count: 'exact', head: true });

        const { count: donationCount } = await supabase.from('donations').select('*', { count: 'exact', head: true });
        const { count: deliveredCount } = await supabase.from('donations').select('*', { count: 'exact', head: true }).eq('status', 'DELIVERED');

        res.json({
            totalUsers: userCount,
            donors: donorCount,
            ngos: ngoCount,
            volunteers: volunteerCount,
            totalDonations: donationCount,
            deliveredDonations: deliveredCount
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', auth, checkAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('user_id, name, email, role, phone, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/donations
// @desc    Get all donations
// @access  Private (Admin only)
router.get('/donations', auth, checkAdmin, async (req, res) => {
    try {
        const { data: donations, error } = await supabase
            .from('donations')
            .select(`
                *,
                donors ( users(name) ),
                ngos ( organization_name )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(donations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
