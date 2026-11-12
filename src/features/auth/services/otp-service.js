import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Op, fn, col, where } from '@/shared/database/orm.js';
import { Setting, AuthOtp, User, AuthLog } from '../../../shared/models/index.js';

export function generateOtpCode() {
    return crypto.randomInt(100000, 1000000).toString();
}

async function getSettingsMap() {
    try {
        const rows = await Setting.findAll({
            attributes: ['key', 'value'],
            raw: true
        });
        const map = {};
        if (rows && Array.isArray(rows)) {
            rows.forEach(r => { map[r.key] = r.value; });
        }
        return map;
    } catch (err) {
        console.error('[otp] getSettingsMap error:', err?.message);
        return {};
    }
}

export async function saveOtpToDatabase(destination, code, ttlMinutes = 10) {
    const cleanDest = destination.trim().toLowerCase();
    const safeTtl = Math.max(1, Math.min(60, parseInt(ttlMinutes, 10) || 10));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    await AuthOtp.destroy({
        where: {
            destination: cleanDest,
            verified: 0
        }
    }).catch(err => {
        console.error('[otp] Invalidate previous OTP error:', err?.message);
    });

    AuthOtp.destroy({
        where: {
            expires_at: {
                [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        }
    }).catch(err => {
        console.error('[otp] Expired OTP cleanup error:', err?.message);
    });

    await AuthOtp.create({
        destination: cleanDest,
        code: codeHash,
        expires_at: new Date(Date.now() + safeTtl * 60 * 1000),
        verified: 0,
        created_at: new Date()
    });
}

export async function sendEmailOtp(email, code) {
    const cleanEmail = email.trim().toLowerCase();
    const settings = await getSettingsMap();
    const user = settings.GMAIL_USER;
    const pass = settings.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
        console.log(`\n[OTP Code] for ${cleanEmail}: ${code}\n`);
        return {
            sent: false,
            devMode: true,
            message: 'Gmail credentials not configured.'
        };
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });

        await transporter.sendMail({
            from: `"The Root" <${user}>`,
            to: cleanEmail,
            subject: 'Your Login Verification Code',
            text: `Your verification code is: ${code}\n\nThis code is valid for 10 minutes. Do not share it with anyone.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #333; text-align: center;">Verification Code</h2>
                    <p style="color: #666; font-size: 14px;">Use the following code to sign in to your The Root account. It expires in 10 minutes.</p>
                    <div style="background-color: #f4f4f4; border-radius: 6px; padding: 16px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${code}</span>
                    </div>
                    <p style="color: #999; font-size: 12px; text-align: center;">If you did not request this code, please ignore this email.</p>
                </div>
            `
        });

        return { sent: true };
    } catch (err) {
        console.error('Email OTP send error:', err);
        return { sent: false, error: err.message };
    }
}

export async function sendTelegramOtp(destination, code, userChatId = null) {
    const settings = await getSettingsMap();
    const token = settings.TELEGRAM_BOT_TOKEN;
    const adminChatId = settings.TELEGRAM_CHAT_ID;
    const targetChatId = userChatId || adminChatId;

    if (!token || !targetChatId) {
        console.log(`\n[OTP Code] Telegram for ${destination}: ${code}\n`);
        return {
            sent: false,
            devMode: true,
            message: 'Telegram Bot credentials not configured.'
        };
    }

    try {
        const text = `🔐 *The Root — Verification Code*\n\n` +
            `Destination: \`${destination}\`\n` +
            `Code: *${code}*\n\n` +
            `⏱ Valid for 10 minutes. Do not share this code.`;

        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: targetChatId,
                text,
                parse_mode: 'Markdown'
            })
        });

        const data = await res.json();
        if (!data.ok) {
            throw new Error(data.description || 'Failed to send Telegram message');
        }

        return { sent: true };
    } catch (err) {
        console.error('Telegram OTP send error:', err);
        return { sent: false, error: err.message };
    }
}

export async function dispatchOtp(destination, preferredChannel = null) {
    const code = generateOtpCode();
    await saveOtpToDatabase(destination, code);

    const cleanDest = destination.trim().toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanDest);

    const settings = await getSettingsMap();
    const systemChannel = (settings.DEFAULT_OTP_CHANNEL || 'telegram').toLowerCase();

    let selectedChannel;
    if (preferredChannel && ['email', 'telegram'].includes(preferredChannel.toLowerCase())) {
        selectedChannel = preferredChannel.toLowerCase();
    } else if (isEmail && systemChannel === 'email') {
        selectedChannel = 'email';
    } else {
        selectedChannel = 'telegram';
    }

    let dispatchResult;
    if (selectedChannel === 'email') {
        dispatchResult = await sendEmailOtp(cleanDest, code);
    } else {
        let userChatId = null;
        try {
            const users = await User.findAll({
                attributes: ['telegram_chat_id'],
                where: {
                    [Op.or]: [
                        where(fn('LOWER', col('email')), cleanDest),
                        where(fn('LOWER', col('username')), cleanDest),
                        { phone: cleanDest }
                    ]
                },
                limit: 1,
                raw: true
            });
            if (users && users.length > 0 && users[0].telegram_chat_id) {
                userChatId = users[0].telegram_chat_id;
            }
        } catch (err) {
            console.error('[otp] Telegram user lookup error:', err?.message);
        }

        dispatchResult = await sendTelegramOtp(cleanDest, code, userChatId);
    }

    let maskedDestination = '';
    if (selectedChannel === 'email') {
        const atIdx = cleanDest.indexOf('@');
        if (atIdx > 2) {
            maskedDestination = `${cleanDest.slice(0, 2)}***@${cleanDest.slice(atIdx + 1)}`;
        } else {
            maskedDestination = 'your registered email';
        }
    } else {
        maskedDestination = 'Telegram (your Telegram)';
    }

    return {
        success: true,
        channel: selectedChannel,
        sent: dispatchResult.sent,
        devMode: dispatchResult.devMode,
        maskedDestination,
        message: dispatchResult.sent
            ? (selectedChannel === 'email' ? `Verification code sent to ${maskedDestination}` : 'Verification code sent to your Telegram.')
            : (dispatchResult.message || 'OTP could not be sent.')
    };
}

export const createAndSendOtp = dispatchOtp;

export async function verifyOtpCode(destination, code) {
    if (!destination || !code) {
        return { valid: false, error: 'Please enter both login and OTP code.' };
    }

    const cleanDest = destination.trim().toLowerCase();
    const cleanCode = code.trim();

    try {
        const failCount = await AuthLog.count({
            where: {
                action: 'OTP_LOGIN_FAILED',
                details: { [Op.like]: `%${cleanDest}%` },
                created_at: {
                    [Op.gt]: new Date(Date.now() - 15 * 60 * 1000)
                }
            }
        });
        if (failCount >= 5) {
            return { valid: false, error: 'Too many failed login attempts. Please wait 15 minutes before trying again.' };
        }
    } catch (err) {
        console.error('[otp] Rate limit count check error:', err?.message);
    }

    try {
        const codeHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

        const otpRecord = await AuthOtp.findOne({
            attributes: ['id', 'expires_at', 'verified'],
            where: {
                destination: cleanDest,
                code: [codeHash, cleanCode],
                verified: 0,
                expires_at: { [Op.gt]: new Date() }
            },
            order: [['id', 'DESC']],
            raw: true
        });

        if (!otpRecord) {
            return { valid: false, error: 'Invalid or expired OTP code.' };
        }

        await AuthOtp.update({ verified: 1 }, { where: { id: otpRecord.id } });

        return { valid: true };
    } catch (err) {
        console.error('Error verifying OTP:', err);
        return { valid: false, error: 'An error occurred while verifying OTP.' };
    }
}

export async function sendTelegramNotification(message) {
    const settings = await getSettingsMap();
    const token = settings.TELEGRAM_BOT_TOKEN;
    const adminChatId = settings.TELEGRAM_CHAT_ID;
    
    if (!token || !adminChatId) return { sent: false };
    
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: adminChatId, text: message, parse_mode: 'Markdown' })
        });
        return { sent: res.ok };
    } catch (e) {
        console.error('Telegram Notif Error:', e);
        return { sent: false };
    }
}
