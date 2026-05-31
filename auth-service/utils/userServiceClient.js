const axios = require('axios');
const { createHash } = require('crypto');

const stripTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const USER_SERVICE_URL = stripTrailingSlash(process.env.USER_SERVICE_URL || process.env.USER_API_URL || '');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const buildUsername = (name, email, stableId) => {
    const emailLocalPart = normalizeEmail(email).split('@')[0] || 'user';
    const base = String(emailLocalPart || name || 'user')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'user';
    const suffix = createHash('sha1').update(String(stableId || email || name || Date.now())).digest('hex').slice(0, 6);

    return `${base}_${suffix}`;
};

const buildSyntheticPhoneNumber = (stableId) => {
    const digest = createHash('sha1').update(String(stableId || Date.now())).digest('hex');
    const digits = String(parseInt(digest.slice(0, 12), 16)).replace(/\D/g, '').padEnd(8, '0').slice(0, 8);

    return `09${digits}`;
};

const normalizeUserList = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.value)) return data.value;
    if (data && Array.isArray(data.users)) return data.users;

    return [];
};

const getUserByEmail = async (email) => {
    if (!USER_SERVICE_URL || !email) return null;

    const { data } = await axios.get(`${USER_SERVICE_URL}/users`, {
        params: { email: normalizeEmail(email) },
        timeout: 10000,
    });

    return normalizeUserList(data)[0] || null;
};

const createUserProfile = async ({ name, email, phoneNumber, stableId }) => {
    const normalizedEmail = normalizeEmail(email);
    const payload = {
        username: buildUsername(name, normalizedEmail, stableId),
        email: normalizedEmail,
        fullName: name || normalizedEmail.split('@')[0],
        phoneNumber: phoneNumber || buildSyntheticPhoneNumber(stableId || normalizedEmail),
    };

    const { data } = await axios.post(`${USER_SERVICE_URL}/users`, payload, {
        timeout: 10000,
    });

    return data;
};

const ensureUserProfile = async ({ name, email, phoneNumber, stableId }) => {
    if (!USER_SERVICE_URL) {
        console.warn('user-service integration skipped: USER_SERVICE_URL is not configured');
        return null;
    }

    const existingProfile = await getUserByEmail(email);
    if (existingProfile) return existingProfile;

    try {
        return await createUserProfile({ name, email, phoneNumber, stableId });
    } catch (error) {
        if (error.response && error.response.status === 409) {
            return getUserByEmail(email);
        }

        throw error;
    }
};

module.exports = {
    getUserByEmail,
    ensureUserProfile,
};
