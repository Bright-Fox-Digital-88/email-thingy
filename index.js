const express = require('express');
const cors = require('cors');
const Mailgun = require('mailgun.js');
const formData = require('form-data');
const fs = require('fs');
const path = require('path');

// Load site configurations
const sitesConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'sites-config.json'), 'utf8')
);

const app = express();

// Configure CORS to only allow specific domains
app.use(cors({
  origin: Object.keys(sitesConfig).filter(key => key !== 'mailgunConfig'),
  optionsSuccessStatus: 200
}));

app.use(express.json());

const mailgun = new Mailgun(formData);

app.post('/', async (req, res) => {
  const origin = req.headers.origin;
  
  // Check if the origin is allowed
  const siteConfig = sitesConfig[origin];
  if (!siteConfig) {
    res.status(403).json({ error: 'Unauthorized origin' });
    return;
  }

  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone) {
    res.status(400).json({ error: 'Name, email, and phone are required' });
    return;
  }

  const mg = mailgun.client({
    username: 'api',
    key: sitesConfig.mailgunConfig.apiKey,
  });

  try {
    await mg.messages.create(sitesConfig.mailgunConfig.domain, {
      from: `${siteConfig.fromName} <noreply@${sitesConfig.mailgunConfig.domain}>`,
      to: siteConfig.toEmail,
      subject: siteConfig.subject,
      text: `New lead from ${siteConfig.siteName}:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message || 'No message provided'}\n\nTime: ${new Date().toLocaleString()}`,
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
  console.log('Allowed origins:', Object.keys(sitesConfig).filter(key => key !== 'mailgunConfig'));
}); 
