const express = require('express');
const Mailgun = require('mailgun.js');
const formData = require('form-data');

const app = express();
app.use(express.json());

const mailgun = new Mailgun(formData);

app.post('/', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone) {
    res.status(400).json({ error: 'Name, email, and phone are required' });
    return;
  }

  const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
  });

  try {
    await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `Website Contact Form <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to: process.env.MAILGUN_TO_EMAIL,
      subject: 'New Lead from Website',
      text: `New lead from website contact form:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message || 'No message provided'}\n\nTime: ${new Date().toLocaleString()}`,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 