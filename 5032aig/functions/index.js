/**
 * Firebase Functions v1 (Express)
 * Enhanced version: supports single & bulk email sending via SendGrid
 */
const functions = require('firebase-functions/v1');
const express = require('express');
const sgMail = require('@sendgrid/mail');

// === Setup SendGrid ===
const SENDGRID_KEY = functions.config().sendgrid && functions.config().sendgrid.key;
if (!SENDGRID_KEY) {
  console.error('[BOOT] Missing functions.config().sendgrid.key');
}
sgMail.setApiKey(SENDGRID_KEY);

const app = express();
app.use(express.json({ limit: '5mb' }));

// === Enable CORS ===
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  next();
});

// === Main POST Endpoint ===
app.post('/', async (req, res) => {
  try {
    const rawBody =
      typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : req.body || {};

    console.log('[HIT] sendEmail body:', JSON.stringify({
      ...rawBody,
      attachment: rawBody.attachment ? { ...rawBody.attachment, contentBase64: '<omitted>' } : undefined,
    }));

    const FROM = 'no-reply@melsustain.tech';

    // =====================================================
    // 🧩 NEW FEATURE: Bulk Email Mode
    // =====================================================
    if (Array.isArray(rawBody.bulk)) {
      if (!SENDGRID_KEY) {
        return res.status(500).json({ success: false, error: 'SendGrid key not set' });
      }

      console.log(`[BULK] Sending ${rawBody.bulk.length} messages...`);

      const sendJobs = rawBody.bulk
        .map((msg) => {
          if (!msg.to || !msg.subject || !msg.text) {
            console.warn('[WARN] Skipped incomplete message:', msg);
            return null;
          }

          const mail = {
            to: msg.to,
            from: { email: FROM, name: 'AIG' },
            subject: msg.subject,
            text: msg.text,
            html: msg.html || msg.text,
            replyTo: msg.replyTo || undefined,
            attachments:
              msg.attachment?.contentBase64 && msg.attachment?.filename
                ? [
                    {
                      content: msg.attachment.contentBase64,
                      filename: msg.attachment.filename,
                      type: msg.attachment.mimeType || 'application/octet-stream',
                      disposition: 'attachment',
                    },
                  ]
                : undefined,
          };
          return sgMail.send(mail);
        })
        .filter(Boolean);

      await Promise.all(sendJobs);
      console.log('[OK] Bulk emails sent');
      return res.status(200).json({ success: true, count: sendJobs.length });
    }

    // =====================================================
    // 🧩 LEGACY MODE: Two fixed emails (user + admin)
    // =====================================================
    let {
      userTo,
      adminTo,
      userSubject,
      userText,
      adminSubject,
      adminText,
      replyTo,
      attachment,
    } = rawBody;

    // backward compatibility fallback
    if (!userTo && rawBody.to) {
      userTo = rawBody.to;
      userSubject = rawBody.subject || 'Thanks for your feedback!';
      userText = rawBody.text || 'Thanks for your feedback!';
      adminTo = 'hsha0055@student.monash.edu';
      adminSubject = 'Feedback (legacy)';
      adminText = rawBody.text || '';
    }

    if (!SENDGRID_KEY) {
      return res.status(500).json({ success: false, error: 'SendGrid key not set' });
    }

    if (!userTo || !adminTo || !userSubject || !userText || !adminSubject || !adminText) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // === Prepare two messages ===
    const msgToUser = {
      to: userTo,
      from: { email: FROM, name: 'MelSustain' },
      subject: userSubject,
      text: userText,
    };

    const msgToAdmin = {
      to: adminTo,
      from: { email: FROM, name: 'MelSustain' },
      subject: adminSubject,
      text: adminText,
      replyTo: replyTo || undefined,
      attachments:
        attachment?.contentBase64 && attachment?.filename
          ? [
              {
                content: attachment.contentBase64,
                filename: attachment.filename,
                type: attachment.mimeType || 'application/octet-stream',
                disposition: 'attachment',
              },
            ]
          : undefined,
    };

    console.log('[SEND] userTo:', userTo, '; adminTo:', adminTo);
    await Promise.all([sgMail.send(msgToUser), sgMail.send(msgToAdmin)]);
    console.log('[OK] Two emails sent');

    return res.status(200).json({ success: true });
  } catch (err) {
    const detail = err && (err.response?.body || err.message || err);
    console.error('[ERR] sendEmail:', detail);
    return res.status(500).json({ success: false, error: err.message || 'Send error' });
  }
});

// === Export function to Firebase ===
exports.sendEmail = functions.region('us-central1').https.onRequest(app);
