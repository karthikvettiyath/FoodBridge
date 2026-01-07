const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/authMiddleware');

// @route   GET api/notifications
// @desc    Get notifications for the logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(notifications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('notification_id', req.params.id)
            .eq('user_id', req.user.id); // Ensure ownership

        if (error) throw error;
        res.json({ msg: 'Marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const db = require('../config/db');

// @route   DELETE api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const { rows, rowCount } = await db.query(
            'DELETE FROM notifications WHERE notification_id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );

        if (rowCount === 0) return res.status(404).json({ msg: 'Notification not found' });

        res.json({ msg: 'Notification deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
