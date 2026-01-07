const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

exports.register = async (req, res) => {
    const { name, email, password, role, phone, address, organization_name } = req.body;

    try {
        // Check if user exists
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert User
        const { data: user, error: insertError } = await supabase
            .from('users')
            .insert([
                { name, email, password: hashedPassword, role, phone }
            ])
            .select()
            .single();

        if (insertError) throw insertError;

        // Handle Role Specific Tables
        if (role === 'DONOR') {
            const { error: donorError } = await supabase.from('donors').insert([{ user_id: user.user_id, address }]);
            if (donorError) throw donorError;
        } else if (role === 'NGO') {
            const { error: ngoError } = await supabase.from('ngos').insert([{ user_id: user.user_id, organization_name, address }]);
            if (ngoError) throw ngoError;
        } else if (role === 'VOLUNTEER') {
            const { error: volError } = await supabase.from('volunteers').insert([{ user_id: user.user_id }]);
            if (volError) throw volError;
        }

        // Create Token
        const payload = {
            user: {
                id: user.user_id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.user_id, name: user.name, role: user.role } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.user_id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.user_id, name: user.name, role: user.role } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
