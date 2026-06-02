const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const DB_PATH = path.join(__dirname, 'contacts.db')

const transporter = createTransport()
const emailEnabled = Boolean(transporter)

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Không thể mở database:', err)
    process.exit(1)
  }
})

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )`
  )
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname)))

function createTransport() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS } = process.env
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email SMTP chưa được cấu hình. Chỉ lưu liên hệ vào database.')
    return null
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: EMAIL_SECURE === 'true',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  })
}

function sendContactEmail(contact) {
  if (!transporter) {
    return Promise.resolve(null)
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
    subject: `Liên hệ mới từ ${contact.name}`,
    text: `Bạn có tin nhắn mới từ ${contact.name} <${contact.email}>:\n\n${contact.message}`,
    html: `<p><strong>Liên hệ mới từ</strong> ${contact.name} &lt;${contact.email}&gt;</p><p><strong>Nội dung:</strong></p><p>${contact.message}</p><p><em>Thời gian: ${contact.createdAt}</em></p>`
  }

  return transporter.sendMail(mailOptions)
}

function saveContact(contact) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO contacts (name, email, message, createdAt) VALUES (?, ?, ?, ?)'
    db.run(query, [contact.name, contact.email, contact.message, contact.createdAt], function (err) {
      if (err) {
        return reject(err)
      }
      resolve({ id: this.lastID })
    })
  })
}

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ các trường.' })
  }

  const contact = {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString()
  }

  try {
    await saveContact(contact)

    let emailInfo = null
    let emailStatus = 'Email chưa được cấu hình trên server.'
    if (emailEnabled) {
      try {
        emailInfo = await sendContactEmail(contact)
        emailStatus = emailInfo ? 'Email thông báo đã được gửi.' : 'Email đã được cấu hình nhưng gửi thất bại.'
      } catch (mailError) {
        console.error('Gửi email thất bại:', mailError)
        emailStatus = 'Email đã được cấu hình nhưng gửi thất bại.'
      }
    }

    const responseMessage = `Cảm ơn, tin nhắn đã được ghi nhận. ${emailStatus}`
    return res.json({ status: 'ok', message: responseMessage, emailSent: Boolean(emailInfo), emailConfigured: emailEnabled })
  } catch (error) {
    console.error('Contact save error:', error)
    return res.status(500).json({ error: 'Lỗi máy chủ. Vui lòng thử lại sau.' })
  }
})

app.get('/api/contacts', (req, res) => {
  const adminKey = req.query.key || ''
  if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Không có quyền truy cập.' })
  }

  db.all('SELECT id, name, email, message, createdAt FROM contacts ORDER BY id DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Lỗi đọc dữ liệu liên hệ.' })
    }
    res.json(rows)
  })
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`)
  if (!emailEnabled) {
    console.log('Chú ý: Email SMTP chưa được cấu hình. Thiết lập biến môi trường EMAIL_HOST, EMAIL_USER, EMAIL_PASS để kích hoạt.')
  }
})
