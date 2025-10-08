/**
 * Firebase Functions v1 (Express)
 * Send two emails via SendGrid (+ attachment + replyTo)
 */
const functions = require('firebase-functions/v1');
const express = require('express');
const sgMail = require('@sendgrid/mail');

const SENDGRID_KEY = functions.config().sendgrid && functions.config().sendgrid.key;
if (!SENDGRID_KEY) {
  console.error('[BOOT] Missing functions.config().sendgrid.key');
}
sgMail.setApiKey(SENDGRID_KEY);

const app = express();

app.use(express.json({ limit: '5mb' }));

// CORS
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  next();
});

// POST /
app.post('/', async (req, res) => {
  try {

    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    console.log('[HIT] sendEmail v1 body:', JSON.stringify({
      ...rawBody,
      attachment: rawBody.attachment ? { ...rawBody.attachment, contentBase64: '<omitted>' } : undefined
    }));

    let {
      userTo,       // user email
      adminTo,      // your email
      userSubject,  // to user's title
      userText,     // to user's content(Thanks...)
      adminSubject, // to admin title
      adminText,    // to admin content
      replyTo,      // reply to user
      attachment    // { filename, contentBase64, mimeType }
    } = rawBody;

    
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

    const FROM = 'no-reply@melsustain.tech';

    // A) to user
    const msgToUser = {
      to: userTo,
      from: { email: FROM, name: 'MelSustain' },
      subject: userSubject,
      text: userText
    };

    // B) to admin
    const msgToAdmin = {
      to: adminTo,
      from: { email: FROM, name: 'MelSustain' },
      subject: adminSubject,
      text: adminText,
      replyTo: replyTo || undefined,
      attachments: attachment?.contentBase64 && attachment?.filename ? [{
        content: attachment.contentBase64,
        filename: attachment.filename,
        type: attachment.mimeType || 'application/octet-stream',
        disposition: 'attachment'
      }] : undefined
    };

    console.log('[SEND] userTo:', userTo, '; adminTo:', adminTo);
    await Promise.all([sgMail.send(msgToUser), sgMail.send(msgToAdmin)]);
    console.log('[OK] Emails sent');

    return res.status(200).json({ success: true });
  } catch (err) {
    
    const detail = err && (err.response?.body || err.message || err);
    console.error('[ERR] sendEmail:', detail);
    return res.status(500).json({ success: false, error: err.message || 'Send error' });
  }
});


exports.sendEmail = functions.region('us-central1').https.onRequest(app);
