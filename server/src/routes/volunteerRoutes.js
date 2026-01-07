const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/authMiddleware');

// @route   GET api/volunteer/my-pickups
// @desc    Get pickups assigned to current volunteer
// @access  Private (Volunteer only)
router.get('/my-pickups', auth, async (req, res) => {
    if (req.user.role !== 'VOLUNTEER') {
        return res.status(403).json({ msg: 'Access denied: Volunteers only' });
    }

    try {
        // Get volunteer_id
        const { data: vol, error: volError } = await supabase
            .from('volunteers')
            .select('volunteer_id')
            .eq('user_id', req.user.id)
            .single();

        if (volError || !vol) return res.status(400).json({ msg: 'Volunteer profile not found' });

        // Fetch pickups with donation and donor details
        // We need to join: pickups -> donations -> donors -> users (for name/phone)
        // AND pickups -> donations -> donors (for address)
        // AND pickups -> donations (for food details)

        // Supabase join syntax is specific.
        const { data: pickups, error } = await supabase
            .from('pickups')
            .select(`
                *,
                donations (
                    food_name,
                    quantity,
                    food_type,
                    donors (
                        address,
                        users (name, phone)
                    ),
                    ngos (
                        organization_name,
                        address,
                        users (phone)
                    )
                )
            `)
            .eq('volunteer_id', vol.volunteer_id)
            .order('pickup_time', { ascending: false });

        if (error) throw error;

        res.json(pickups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// NOTE: Status updates are handled by the more complete handler further below.

// @route   GET api/volunteer/invitations
// @desc    Get all donations approved by donors (Waiting for volunteer)
// @access  Private (Volunteer only)
router.get('/invitations', auth, async (req, res) => {
    if (req.user.role !== 'VOLUNTEER') {
        return res.status(403).json({ msg: 'Access denied: Volunteers only' });
    }

    try {
        // Fetch donations with status 'APPROVED'
        // Include Donor and NGO details so volunteer can see where to go
        const { data: invitations, error } = await supabase
            .from('donations')
            .select(`
                *,
                donors (
                    address,
                    users (name, phone)
                ),
                ngos (
                    organization_name,
                    address,
                    users (name, phone)
                )
            `)
            .eq('status', 'APPROVED')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(invitations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/volunteer/accept
// @desc    Volunteer accepts an invitation (Create Pickup)
// @access  Private (Volunteer only)
router.post('/accept', auth, async (req, res) => {
    if (req.user.role !== 'VOLUNTEER') {
        return res.status(403).json({ msg: 'Access denied: Volunteers only' });
    }

    const { donationId } = req.body;

    try {
        const { data: vol } = await supabase.from('volunteers').select('volunteer_id').eq('user_id', req.user.id).single();
        if (!vol) return res.status(400).json({ msg: 'Volunteer profile not found' });

        // 1. Check if Donation is still APPROVED (concurrency check)
        const { data: donation } = await supabase
            .from('donations')
            .select('*, donors(user_id), ngos(user_id)')
            .eq('donation_id', donationId)
            .single();
        if (donation.status !== 'APPROVED') {
            return res.status(400).json({ msg: 'Donation not available or already assigned' });
        }

        // 2. Create Pickup Record with status 'ACCEPTED_OFFER'
        const { data: pickup, error: pickupError } = await supabase
            .from('pickups')
            .insert([{
                donation_id: donationId,
                volunteer_id: vol.volunteer_id,
                status: 'ACCEPTED_OFFER', // Step 1 of delivery
                pickup_time: new Date() // Marking accept time
            }])
            .select()
            .single();

        if (pickupError) throw pickupError;

        // 3. Update Donation Status to ASSIGNED
        await supabase
            .from('donations')
            .update({ status: 'ASSIGNED' })
            .eq('donation_id', donationId);

        // 4. Set Volunteer to BUSY
        await supabase.from('volunteers').update({ availability: 'BUSY' }).eq('volunteer_id', vol.volunteer_id);

        // 5. Create Notification for Donor and NGO
        const notifications = [];
        // Notify Donor
        if (donation.donors && donation.donors.user_id) {
            notifications.push({
                user_id: donation.donors.user_id,
                message: `A volunteer has accepted your donation pickup request.`,
                type: 'VOLUNTEER_ACCEPTED'
            });
        }
        // Notify NGO
        if (donation.ngos && donation.ngos.user_id) {
            notifications.push({
                user_id: donation.ngos.user_id,
                message: `A volunteer has accepted the pickup for donation: ${donation.food_name}.`,
                type: 'VOLUNTEER_ACCEPTED'
            });
        }
        if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
        }

        res.json(pickup);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/volunteer/pickups/:id/status
// @desc    Update pickup status (Granular steps)
// @access  Private (Volunteer only)
router.put('/pickups/:id/status', auth, async (req, res) => {
    if (req.user.role !== 'VOLUNTEER') {
        return res.status(403).json({ msg: 'Access denied: Volunteers only' });
    }

    const { status } = req.body;
    const validStatuses = ['ACCEPTED_OFFER', 'ACCEPTED_PASSAGE', 'OUT_FOR_DELIVERY', 'NEAR_LOCATION', 'PICKED', 'DELIVERED'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ msg: `Invalid status: ${status}` });
    }

    try {
        // Update Pickup Status
        const { data, error } = await supabase
            .from('pickups')
            .update({ status })
            .eq('pickup_id', req.params.id)
            .select();

        if (error) throw error;

        const pickup = data[0];

        // Sync Donation Status (mirrors pickup status for visibility)
        await supabase.from('donations').update({ status }).eq('donation_id', pickup.donation_id);

        // Notify Donor and NGO about status update
        const { data: donation } = await supabase
            .from('donations')
            .select('*, donors(user_id), ngos(user_id)')
            .eq('donation_id', pickup.donation_id)
            .single();

        if (donation) {
            const notifications = [];
            const msg = `Update on your donation: Volunteer status is now ${status}`;
            // Notify Donor
            if (donation.donors?.user_id) {
                notifications.push({ user_id: donation.donors.user_id, message: msg, type: 'STATUS_UPDATE' });
            }
            // Notify NGO
            if (donation.ngos?.user_id) {
                notifications.push({ user_id: donation.ngos.user_id, message: msg, type: 'STATUS_UPDATE' });
            }
            if (notifications.length > 0) {
                await supabase.from('notifications').insert(notifications);
            }
        }

        // Logic for PICKED/DELIVERED side effects
        if (status === 'DELIVERED') {
            const { data: vol } = await supabase.from('volunteers').select('volunteer_id').eq('user_id', req.user.id).single();
            await supabase.from('volunteers').update({ availability: 'AVAILABLE' }).eq('volunteer_id', vol.volunteer_id);
            // Update delivery_time
            await supabase.from('pickups').update({ delivery_time: new Date() }).eq('pickup_id', req.params.id);
        }

        res.json(data[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
