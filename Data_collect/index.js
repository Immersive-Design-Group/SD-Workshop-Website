'use strict';

const mysql = require('mysql2/promise');
const crypto = require('crypto');
const https = require('https');
const nodemailer = require('nodemailer');

/* ===================== 配置（优先 env，缺省回退到你提供的值） ===================== */
const DEFAULTS = {
  HOST: 'rm-wz9ri3mmunqbr302w.mysql.rds.aliyuncs.com',
  PORT: '3306',
  USER: 'IDG',
  PASS: 'MAKE555!',         // ⚠️ 仅联调兜底；跑通后请改为仅用环境变量
  DB:   'sd_workshop'
};

const dbConfig = {
  host: process.env.DB_HOST || DEFAULTS.HOST,
  port: parseInt(process.env.DB_PORT || DEFAULTS.PORT, 10),
  user: process.env.DB_USER || DEFAULTS.USER,
  password: process.env.DB_PASS || DEFAULTS.PASS,
  database: process.env.DB_NAME || DEFAULTS.DB,
  charset: 'utf8mb4',
  timezone: '+08:00'
};

/* ===================== 连接池（实例复用） ===================== */
let pool = null;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    console.log('DB_TARGET =', { host: dbConfig.host, port: dbConfig.port, db: dbConfig.database, user: dbConfig.user });
  }
  return pool;
}

/* ===================== 工具函数 ===================== */
function parseMaybeBufferEvent(ev) {
  if (!ev) return {};
  if (typeof ev === 'string') { try { return JSON.parse(ev); } catch { return {}; } }
  if (Buffer.isBuffer && Buffer.isBuffer(ev)) { try { return JSON.parse(ev.toString('utf8')); } catch { return {}; } }
  if (ev && ev.type === 'Buffer' && Array.isArray(ev.data)) {
    try { return JSON.parse(Buffer.from(ev.data).toString('utf8')); } catch { return {}; }
  }
  return ev;
}

function safeJSONParse(s) {
  if (!s) return {};
  try { return typeof s === 'string' ? JSON.parse(s) : s; } catch { return {}; }
}

function parseQueryString(qs) {
  if (!qs || typeof qs !== 'string') return {};
  const out = {};
  const str = qs.startsWith('?') ? qs.slice(1) : qs;
  for (const seg of str.split('&')) {
    if (!seg) continue;
    const [k, v] = seg.split('=');
    const key = decodeURIComponent(k || '').trim();
    const val = decodeURIComponent((v || '').trim());
    if (!key) continue;
    if (out[key] === undefined) out[key] = val;
    else if (Array.isArray(out[key])) out[key].push(val);
    else out[key] = [out[key], val];
  }
  return out;
}

function ok(headers, data, code = 200) {
  return { statusCode: code, headers, body: JSON.stringify(data) };
}

function err(headers, message, code = 500, extra) {
  const payload = extra ? { error: message, ...extra } : { error: message };
  return { statusCode: code, headers, body: JSON.stringify(payload) };
}

/* ===================== 主入口（Buffer 安全解析 + 路由解析） ===================== */
exports.handler = async (rawEvent, context) => {
  const ALLOWED_ORIGINS = new Set([
    'https://sustechsdworkshop.com',
    'https://www.sustechsdworkshop.com',
    'https://immersive-design-group.github.io',
    'https://immersive-design-group.github.io/SD-Workshop-Website',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ]);
  
  function corsHeaders(event) {
    // 完全移除CORS头部，让浏览器处理
    return {
      'Content-Type': 'application/json'
    };
  }

  const event = parseMaybeBufferEvent(rawEvent) || {};
  try { console.log('EVENT_PARSED =', JSON.stringify(event)); } catch {}

  const h0 = event.headers || event.Headers || {};
  const headersLower = {};
  for (const k in h0) headersLower[k.toLowerCase()] = h0[k];

  // Method
  const methodRaw =
    event.httpMethod ||
    event.method ||
    event.requestContext?.http?.method ||
    headersLower['x-fc-request-method'] ||
    headersLower['x-forwarded-method'] ||
    headersLower['x-http-method-override'] ||
    'GET';
  const method = String(methodRaw).toUpperCase();

  // Path
  const headerPath =
    headersLower['x-fc-request-uri'] ||
    headersLower['x-fc-request-path'] ||
    headersLower['x-forwarded-uri'] ||
    headersLower['x-original-uri'] ||
    headersLower['x-rewrite-url'];

  const pathCandidate =
    event.rawPath ||
    headerPath ||
    event.path ||
    event.requestPath ||
    event.resourcePath ||
    event.requestContext?.http?.path ||
    '/';

  const qIdx = String(pathCandidate).indexOf('?');
  const rawPath = (qIdx >= 0 ? pathCandidate.slice(0, qIdx) : pathCandidate) || '/';
  const path = String(rawPath).toLowerCase();
  
  console.log('Processing request - Method:', method, 'Path:', path);

  // Query
  const rawQuery =
    event.rawQueryString ||
    headersLower['x-forwarded-query'] ||
    headersLower['x-original-query'] ||
    headersLower['x-fc-query'] ||
    (qIdx >= 0 ? String(pathCandidate).slice(qIdx + 1) : '');

  const qsObj =
    event.queryStringParameters ||
    event.queryParameters ||
    event.queries ||
    parseQueryString(rawQuery) ||
    {};

  // Body（考虑 base64）
  let body = {};
  if (event.body) {
    try {
      const bodyText = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : (typeof event.body === 'string' ? event.body : JSON.stringify(event.body));
      body = safeJSONParse(bodyText);
    } catch { body = {}; }
  }

  const headersBase = corsHeaders(event);

  if (method === 'OPTIONS') return { statusCode: 200, headers: headersBase, body: '' };

  try {
    // 路由
    // Root path handler
    if (path === '/' && method === 'GET') {
      return ok(headersBase, { 
        message: 'SUSTech SD Workshop API', 
        version: '1.0.0',
        endpoints: [
          'GET /api/ping - Health check',
          'GET /api/health - Database health',
          'GET /api/bookings - Get confirmed bookings',
          'GET /api/all-bookings - Get all bookings (including cancelled)',
          'GET /api/admin-deleted - Get admin-deleted bookings only',
          'POST /api/bookings - Create booking',
          'GET /api/send-otp - Send OTP',
          'POST /api/delete-booking - Delete booking (admin or user)',
          'POST /api/debug-admin - Debug admin deletion',
          'GET /api/test-admin - Admin deletion test info'
        ]
      });
    }

    if (path === '/api/ping' && method === 'GET') {
      return ok(headersBase, { ok: true });
    }

    if (path === '/api/health' && method === 'GET') {
      return await handleHealth(headersBase);
    }

    // 调试：查看当前库与表结构
    if (path === '/api/_schema' && method === 'GET') {
      return await handleSchema(headersBase);
    }

    if (path === '/api/bookings' && method === 'GET') {
      console.log('GET /api/bookings request received');
      console.log('Query parameters:', qsObj);
      console.log('Event object keys:', Object.keys(event));
      event.queryStringParameters = qsObj;
      console.log('About to call handleGetBookings');
      const result = await handleGetBookings(event, headersBase);
      console.log('handleGetBookings completed');
      return result;
    }

    if (path === '/api/bookings' && method === 'POST') {
      return await handleCreateBooking(body, headersBase);
    }

    if (path === '/api/send-otp' && method === 'GET') {
      event.queryStringParameters = qsObj;
      return await handleSendOTP(event, headersBase);
    }

    if (path === '/api/delete-booking' && method === 'POST') {
      return await handleDeleteBooking(body, headersBase);
    }

    // Test endpoint for admin deletion
    if (path === '/api/test-admin' && method === 'GET') {
      return ok(headersBase, { 
        message: 'Admin deletion test endpoint',
        adminPassword: 'admin2024',
        testData: {
          id: 'test-booking-id',
          admin: true,
          password: 'admin2024'
        },
        note: 'Use POST /api/delete-booking with the testData structure'
      });
    }

    // Check all bookings including cancelled ones
    if (path === '/api/all-bookings' && method === 'GET') {
      return await handleAllBookings(event, headersBase);
    }

    // Check admin-deleted bookings only
    if (path === '/api/admin-deleted' && method === 'GET') {
      return await handleAdminDeletedBookings(event, headersBase);
    }

    // Debug endpoint to test admin deletion
    if (path === '/api/debug-admin' && method === 'POST') {
      return await handleDebugAdmin(body, headersBase);
    }

    return err(headersBase, 'Not Found', 404, { debug: { path, method } });
  } catch (e) {
    console.error('Handler error:', e);
    return err(headersBase, 'Internal Server Error', 500);
  }
};

/* ===================== 业务实现（已适配你的表结构） ===================== */

// 健康检查（DB）
async function handleHealth(headers) {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT 1 AS ok');
    return ok(headers, { db: rows[0]?.ok === 1 });
  } catch (e) {
    console.error('health db error:', e && e.message);
    return err(headers, String(e && e.message), 500);
  }
}

// 调试：返回当前库与 bookings 表结构
async function handleSchema(headers) {
  try {
    const pool = getPool();
    const [[dbRow]] = await pool.query('SELECT DATABASE() AS db, CURRENT_USER() AS user');
    const [cols] = await pool.query('SHOW COLUMNS FROM `bookings`');
    return ok(headers, { using_db: dbRow.db, user: dbRow.user, columns: cols });
  } catch (e) {
    console.error('Schema debug error:', e && e.message);
    return err(headers, 'Schema debug failed', 500, { detail: String(e && e.message) });
  }
}

// GET /api/bookings?from=YYYY-MM-DD&to=YYYY-MM-DD
async function handleGetBookings(event, headers) {
  const qs = event.queryStringParameters || {};
  const from = qs.from;
  const to = qs.to;

  if (!from || !to) {
    return err(headers, 'Missing from/to parameters', 400);
  }

  const pool = getPool();
  try {
    console.log(`Querying bookings from ${from} to ${to}`);
    const [rows] = await pool.execute(
      `SELECT
          \`id\`,
          \`booking_id\`,
          \`name\`,
          \`email\`,
          \`purpose\`,
          \`device\`,
          \`model\`,
          DATE_FORMAT(\`date\`, '%Y-%m-%d') as \`date\`,
          \`start_time\`,
          \`end_time\`,
          \`total_slots\`,
          \`total_hours\`,
          \`status\`,
          \`created_at\`
       FROM \`bookings\`
       WHERE DATE(\`date\`) BETWEEN ? AND ?
         AND \`status\` = 'CONFIRMED'
       ORDER BY \`date\`, \`start_time\``,
      [from, to]
    );
    console.log(`Found ${rows.length} bookings:`, rows);
    return ok(headers, { bookings: rows }, 200);
  } catch (e) {
    console.error('Get bookings error:', e && e.message);
    return err(headers, 'Query failed', 500, { detail: String(e && e.message) });
  }
}

// GET /api/all-bookings?from=YYYY-MM-DD&to=YYYY-MM-DD (includes cancelled bookings)
async function handleAllBookings(event, headers) {
  const qs = event.queryStringParameters || {};
  const from = qs.from;
  const to = qs.to;

  if (!from || !to) {
    return err(headers, 'Missing from and to parameters', 400);
  }

  const pool = getPool();
  try {
    console.log(`Querying ALL bookings (including cancelled) from ${from} to ${to}`);
    const [rows] = await pool.execute(
      `SELECT
          \`id\`,
          \`booking_id\`,
          \`name\`,
          \`email\`,
          \`purpose\`,
          \`device\`,
          \`model\`,
          DATE_FORMAT(\`date\`, '%Y-%m-%d') as \`date\`,
          \`start_time\`,
          \`end_time\`,
          \`total_slots\`,
          \`total_hours\`,
          \`status\`,
          \`created_at\`,
          \`cancelled_at\`,
          \`cancellation_reason\`
       FROM \`bookings\`
       WHERE DATE(\`date\`) BETWEEN ? AND ?
       ORDER BY \`date\`, \`start_time\``,
      [from, to]
    );
    console.log(`Found ${rows.length} total bookings (including cancelled):`, rows);
    return ok(headers, { 
      message: 'All bookings including cancelled and admin-deleted ones',
      bookings: rows,
      summary: {
        total: rows.length,
        confirmed: rows.filter(r => r.status === 'CONFIRMED').length,
        cancelled: rows.filter(r => r.status === 'CANCELLED').length,
        deletedByAdmin: rows.filter(r => r.status === 'CANCELLED' && r.cancellation_reason === 'Admin deletion').length
      }
    }, 200);
  } catch (e) {
    console.error('Get all bookings error:', e && e.message);
    return err(headers, 'Query failed', 500, { detail: String(e && e.message) });
  }
}

// GET /api/admin-deleted?from=YYYY-MM-DD&to=YYYY-MM-DD (only admin-deleted bookings)
async function handleAdminDeletedBookings(event, headers) {
  const qs = event.queryStringParameters || {};
  const from = qs.from;
  const to = qs.to;

  if (!from || !to) {
    return err(headers, 'Missing from and to parameters', 400);
  }

  const pool = getPool();
  try {
    console.log(`Querying admin-deleted bookings from ${from} to ${to}`);
    const [rows] = await pool.execute(
      `SELECT
          \`id\`,
          \`booking_id\`,
          \`name\`,
          \`email\`,
          \`purpose\`,
          \`device\`,
          \`model\`,
          DATE_FORMAT(\`date\`, '%Y-%m-%d') as \`date\`,
          \`start_time\`,
          \`end_time\`,
          \`total_slots\`,
          \`total_hours\`,
          \`status\`,
          \`created_at\`,
          \`cancelled_at\`,
          \`cancellation_reason\`
       FROM \`bookings\`
       WHERE DATE(\`date\`) BETWEEN ? AND ?
         AND \`status\` = 'CANCELLED'
         AND \`cancellation_reason\` = 'Admin deletion'
       ORDER BY \`cancelled_at\` DESC`,
      [from, to]
    );
    console.log(`Found ${rows.length} admin-deleted bookings:`, rows);
    return ok(headers, { 
      message: 'Admin-deleted bookings',
      bookings: rows,
      count: rows.length
    }, 200);
  } catch (e) {
    console.error('Get admin-deleted bookings error:', e && e.message);
    return err(headers, 'Query failed', 500, { detail: String(e && e.message) });
  }
}

// POST /api/debug-admin - Debug admin deletion
async function handleDebugAdmin(body, headers) {
  console.log('Debug admin deletion called with body:', JSON.stringify(body));
  
  const { id, password } = body;
  const ADMIN_PASSWORD = 'admin2024';
  
  if (!id || !password) {
    return err(headers, 'Missing id or password', 400);
  }
  
  if (password !== ADMIN_PASSWORD) {
    return err(headers, 'Invalid admin password', 400);
  }
  
  const pool = getPool();
  
  try {
    // Check if booking exists
    const [bookingRows] = await pool.execute(
      `SELECT \`id\`, \`date\`, \`start_time\`, \`email\`, \`status\`, \`name\`, \`device\`, \`end_time\`
       FROM \`bookings\`
       WHERE \`id\` = ?`,
      [id]
    );
    
    console.log('Debug: Found bookings:', bookingRows.length);
    
    if (bookingRows.length === 0) {
      return ok(headers, { 
        success: false, 
        message: 'Booking not found',
        searchedId: id,
        totalBookings: 0
      }, 200);
    }
    
    const booking = bookingRows[0];
    
    return ok(headers, { 
      success: true, 
      message: 'Booking found',
      booking: {
        id: booking.id,
        name: booking.name,
        email: booking.email,
        device: booking.device,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status
      },
      debug: {
        searchedId: id,
        foundBookings: bookingRows.length,
        adminPassword: 'admin2024',
        canDelete: true
      }
    }, 200);
    
  } catch (e) {
    console.error('Debug admin error:', e);
    return err(headers, 'Debug failed', 500, { error: e.message });
  }
}

/**
 * 合并连续时间段为单个预订条目
 * @param {Array} slots - 时间段数组
 * @param {string} name - 用户姓名
 * @param {string} email - 用户邮箱
 * @param {string} purpose - 预订目的
 * @returns {Object} 合并后的预订信息
 */
function combineConsecutiveSlots(slots, name, email, purpose) {
  if (!slots || slots.length === 0) {
    throw new Error('No slots provided');
  }

  // 按设备、日期和时间排序
  const sortedSlots = slots.sort((a, b) => {
    if (a.device !== b.device) return a.device.localeCompare(b.device);
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.start_time.localeCompare(b.start_time);
  });

  // 获取第一个时间段的信息
  const firstSlot = sortedSlots[0];
  const device = firstSlot.device || firstSlot.equipment;
  const model = firstSlot.model || '';
  const date = firstSlot.date;

  // 计算总时间段数和总小时数
  const totalSlots = sortedSlots.length;
  const totalHours = (totalSlots * 30) / 60; // 每个时间段30分钟

  // 获取最早开始时间和最晚结束时间
  const startTime = sortedSlots.map(s => s.start_time).sort()[0];
  const endTime = sortedSlots.map(s => s.end_time).sort().slice(-1)[0];

  return {
    device,
    model,
    date,
    start_time: startTime,
    end_time: endTime,
    total_slots: totalSlots,
    total_hours: totalHours
  };
}

// POST /api/bookings
// body: { name, email, purpose, slots: [{ device, model?, date, start_time, end_time, slots, hours }] }
async function handleCreateBooking(body, headers) {
  console.log('handleCreateBooking called with body:', JSON.stringify(body));
  
  const { name, email, purpose, slots } = body;

  if (!name || !email || !purpose || !Array.isArray(slots) || slots.length === 0) {
    console.log('Missing required fields:', { name, email, purpose, slots });
    return err(headers, 'Missing required fields', 400);
  }

  console.log('Getting database pool...');
  const pool = getPool();
  console.log('Database pool obtained');

  try {
    console.log('Starting conflict detection...');
    // 冲突检测（用 device + date + 时间段 + status=CONFIRMED）
    for (const slot of slots) {
      console.log('Checking conflicts for slot:', JSON.stringify(slot));
      const [conflicts] = await pool.execute(
        `SELECT \`id\` FROM \`bookings\`
         WHERE \`device\` = ? AND \`date\` = ? AND \`status\` = 'CONFIRMED'
           AND (
             (\`start_time\` < ? AND \`end_time\` > ?) OR
             (\`start_time\` < ? AND \`end_time\` > ?) OR
             (\`start_time\` >= ? AND \`end_time\` <= ?)
           )`,
        [
          slot.device || slot.equipment, slot.date,
          slot.start_time, slot.start_time,
          slot.end_time,   slot.end_time,
          slot.start_time, slot.end_time
        ]
      );
      console.log('Conflicts found:', conflicts.length);
      if (conflicts.length > 0) {
        console.log('Time slot conflict detected');
        return err(headers, 'Time slot conflict', 409);
      }
    }
    console.log('No conflicts found, proceeding with insertion...');

    // 插入 - 合并连续时间段为单个条目
    console.log('Starting insertion process...');
    const ids = [];
    const slotsJson = JSON.stringify(slots); // 保存原始 slots
    console.log('Slots JSON:', slotsJson);
    
    // 合并连续时间段
    const combinedBooking = combineConsecutiveSlots(slots, name, email, purpose);
    console.log('Combined booking:', JSON.stringify(combinedBooking));
    
    const bookingId = crypto.randomUUID().replace(/-/g, '');
    const device = combinedBooking.device;
    const model = combinedBooking.model;
    const dateString = combinedBooking.date;
    const startTime = combinedBooking.start_time;
    const endTime = combinedBooking.end_time;
    const totalSlots = combinedBooking.total_slots;
    const totalHours = combinedBooking.total_hours;

    console.log('Inserting combined booking with ID:', bookingId);
    console.log('Booking details:', { device, dateString, startTime, endTime, totalSlots, totalHours });
    
    const [res] = await pool.execute(
      `INSERT INTO \`bookings\`
         (\`booking_id\`, \`name\`, \`email\`, \`purpose\`,
          \`device\`, \`model\`, \`date\`, \`start_time\`, \`end_time\`,
          \`total_slots\`, \`total_hours\`,
          \`status\`, \`created_at\`, \`slots_json\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', NOW(), ?)`,
      [
        bookingId, name, email, purpose,
        device, model, dateString, startTime, endTime,
        totalSlots, totalHours,
        slotsJson
      ]
    );
    console.log('Insert result:', res);
    ids.push(res.insertId);
    console.log('Combined booking insertion completed, booking ID:', bookingId);

    // 发送预约成功邮件
    try {
      await sendBookingSuccessEmail(name, email, combinedBooking);
      console.log(`Booking success email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send booking success email:', emailError);
      // 即使邮件发送失败，预约仍然成功
    }

    return ok(headers, { success: true, bookingIds: ids, message: '预约创建成功' }, 201);
  } catch (e) {
    console.error('Create booking error:', e);
    return err(headers, 'Failed to create booking', 500, { detail: String(e && e.message) });
  }
}

// GET /api/send-otp?email=...&id=...
async function handleSendOTP(event, headers) {
  const qs = event.queryStringParameters || {};
  const email = qs.email;
  const id = qs.id;

  if (!email || !id) {
    return err(headers, 'Missing email or id', 400);
  }

  const pool = getPool();

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 分钟

    const [result] = await pool.execute(
      `UPDATE \`bookings\` SET \`otp\` = ?, \`otp_expiry\` = ?
       WHERE \`id\` = ? AND \`email\` = ? AND \`status\` = 'CONFIRMED'`,
      [otp, expiry, id, email]
    );

    if (result.affectedRows === 0) {
      return err(headers, 'Booking not found', 404);
    }

    console.log(`OTP for ${email}: ${otp}`);
    
    // 发送邮件
    try {
      await sendOTPEmail(email, otp);
      console.log(`OTP email sent to ${email} via SUSTech mail server`);
    } catch (emailError) {
      console.error('Failed to send email via SUSTech:', emailError);
      // 即使邮件发送失败，OTP仍然有效
      // 临时解决方案：在控制台显示OTP
      console.log(`📧 邮件发送失败，OTP验证码: ${otp}`);
    }
    
    return ok(headers, { success: true, message: 'OTP 已发送到邮箱', otp }, 200);
  } catch (e) {
    console.error('Send OTP error:', e);
    return err(headers, 'Failed to send OTP', 500);
  }
}

// POST /api/delete-booking { email, id, otp } OR { id, admin, password }
async function handleDeleteBooking(body, headers) {
  console.log('handleDeleteBooking called with body:', JSON.stringify(body));
  
  const { email, id, otp, admin, password } = body;
  const isAdmin = admin === true || admin === 'true';
  const ADMIN_PASSWORD = 'admin2024'; // Change this to your desired password

  console.log('Delete booking request:', { 
    isAdmin, 
    id, 
    email: email ? 'provided' : 'not provided',
    password: password ? 'provided' : 'not provided'
  });

  // Admin deletion - skip OTP and email validation
  if (isAdmin) {
    if (!id || !password) {
      console.log('Admin deletion failed: Missing required fields', { id, password: !!password });
      return err(headers, 'Missing required fields for admin deletion', 400);
    }
    if (password !== ADMIN_PASSWORD) {
      console.log('Admin deletion failed: Invalid password', { provided: password, expected: ADMIN_PASSWORD });
      return err(headers, 'Invalid admin password', 400);
    }
    console.log('Admin deletion validation passed');
  } else {
    // Regular user deletion - require email, booking ID, and OTP
    if (!email || !id || !otp) {
      console.log('User deletion failed: Missing required fields', { email: !!email, id, otp: !!otp });
      return err(headers, 'Missing required fields', 400);
    }
  }

  const pool = getPool();

  try {
    let bookingRows;
    
    if (isAdmin) {
      // Admin deletion - find booking by ID only (any status)
      console.log('Admin deletion: Searching for booking with ID:', id);
      [bookingRows] = await pool.execute(
        `SELECT \`id\`, \`date\`, \`start_time\`, \`email\`, \`otp\`, \`otp_expiry\`, \`status\`, \`name\`, \`device\`, \`end_time\`
         FROM \`bookings\`
         WHERE \`id\` = ?`,
        [id]
      );
      console.log('Admin deletion: Found bookings:', bookingRows.length);
    } else {
      // Regular user deletion - validate email and OTP
      console.log('User deletion: Searching for booking with ID:', id, 'Email:', email);
      [bookingRows] = await pool.execute(
        `SELECT \`id\`, \`date\`, \`start_time\`, \`email\`, \`otp\`, \`otp_expiry\`, \`status\`, \`name\`, \`device\`, \`end_time\`
         FROM \`bookings\`
         WHERE \`id\` = ? AND \`email\` = ? AND \`otp\` = ? AND \`otp_expiry\` > NOW() AND \`status\` = 'CONFIRMED'`,
        [id, email, otp]
      );
      console.log('User deletion: Found bookings:', bookingRows.length);
    }
    
    if (bookingRows.length === 0) {
      console.log('No bookings found for deletion');
      return err(headers, isAdmin ? 'Booking not found' : 'Invalid or expired OTP', 400);
    }

    const booking = bookingRows[0];
    
    // Check if the booking is in the past (only for regular users, admin can delete past bookings)
    if (!isAdmin) {
      const bookingDateTime = new Date(`${booking.date} ${booking.start_time}`);
      const now = new Date();
      
      if (bookingDateTime < now) {
        return err(headers, 'Past bookings cannot be deleted', 400);
      }
    }

    // Update booking status - keep visible but mark as deleted
    const cancellationReason = isAdmin ? 'Admin deletion' : 'User requested deletion';
    
    if (isAdmin) {
      // Admin deletion - use existing CANCELLED status
      console.log('Admin deletion: Updating booking status to CANCELLED');
      try {
        const [updateResult] = await pool.execute(
          `UPDATE \`bookings\` SET \`status\` = 'CANCELLED', \`cancelled_at\` = NOW(), \`cancellation_reason\` = ?
           WHERE \`id\` = ?`,
          [cancellationReason, id]
        );
        console.log('Admin deletion: Update result:', updateResult);
      } catch (columnError) {
        // Fallback if cancellation_reason column doesn't exist
        console.warn('cancellation_reason column not found, using basic update:', columnError.message);
        const [updateResult] = await pool.execute(
          `UPDATE \`bookings\` SET \`status\` = 'CANCELLED', \`cancelled_at\` = NOW()
           WHERE \`id\` = ?`,
          [id]
        );
        console.log('Admin deletion: Fallback update result:', updateResult);
      }
    } else {
      // Regular user deletion - mark as cancelled
      try {
        await pool.execute(
          `UPDATE \`bookings\` SET \`status\` = 'CANCELLED', \`cancelled_at\` = NOW(), \`cancellation_reason\` = ?
           WHERE \`id\` = ?`,
          [cancellationReason, id]
        );
      } catch (columnError) {
        // Fallback if cancellation_reason column doesn't exist
        console.warn('cancellation_reason column not found, using basic update:', columnError.message);
        await pool.execute(
          `UPDATE \`bookings\` SET \`status\` = 'CANCELLED', \`cancelled_at\` = NOW()
           WHERE \`id\` = ?`,
          [id]
        );
      }
    }

    // Send email notifications
    if (isAdmin) {
      // Admin deletion - notify user
      try {
        await sendEmail({
          to: booking.email,
          subject: 'SD-Workshop Booking Cancelled by Admin',
          html: `
            <p>Hi ${booking.name},</p>
            <p>Your booking for <b>${booking.device}</b> on <b>${booking.date}</b> from <b>${booking.start_time}</b> to <b>${booking.end_time}</b> has been cancelled by an administrator.</p>
            <p>If you have any questions, please contact us.</p>
            <p>Regards,<br>SD-Workshop Team</p>
          `
        });
        console.log('Admin deletion notification sent to user');
      } catch (emailError) {
        console.warn('Failed to send admin deletion notification:', emailError);
      }
    } else {
      // Regular user deletion - notify user
      try {
        await sendEmail({
          to: email,
          subject: 'SD-Workshop Booking Deleted',
          html: `
            <p>Hi ${booking.name},</p>
            <p>Your booking for <b>${booking.device}</b> on <b>${booking.date}</b> from <b>${booking.start_time}</b> to <b>${booking.end_time}</b> has been cancelled.</p>
            <p>Regards,<br>SD-Workshop Team</p>
          `
        });
        console.log('User deletion email sent successfully');
      } catch (emailError) {
        console.warn('Failed to send user deletion email:', emailError);
      }
    }

    // Notify admin about deletion
    try {
      const adminSubject = isAdmin ? 
        `Admin Deletion – ${booking.device} ${booking.date} ${booking.start_time}-${booking.end_time}` :
        `Booking Cancelled – ${booking.device} ${booking.date} ${booking.start_time}-${booking.end_time}`;
      
      const adminBody = isAdmin ?
        `<p>Admin deleted booking for <b>${booking.device}</b> on ${booking.date} ${booking.start_time}-${booking.end_time}.<br>User: ${booking.name} (${booking.email})<br>ID: <code>${booking.id}</code></p>` :
        `<p>${booking.name} (${email}) cancelled booking for <b>${booking.device}</b> on ${booking.date} ${booking.start_time}-${booking.end_time}.<br>ID: <code>${booking.id}</code></p>`;
      
      await sendEmail({
        to: 'khowaja.ashfaqali1996@gmail.com', // Admin email
        subject: adminSubject,
        html: adminBody
      });
      console.log('Admin notification sent successfully');
    } catch (adminEmailError) {
      console.warn('Failed to send admin notification:', adminEmailError);
    }

    return ok(headers, { 
      success: true, 
      message: isAdmin ? 'Booking deleted by admin' : '预约已取消' 
    }, 200);
  } catch (e) {
    console.error('Delete booking error:', e);
    return err(headers, 'Failed to delete booking', 500);
  }
}

/* ===================== 邮件发送功能 ===================== */

// 创建SUSTech邮件传输器（基于腾讯企业邮箱）
function createSustechTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.exmail.qq.com', // 腾讯企业邮箱SMTP服务器
    port: 465, // 使用SSL端口
    secure: true, // 使用SSL
    auth: {
      user: 'designworkshop@sustech.edu.cn',
      pass: process.env.SUSTECH_EMAIL_PASSWORD || 'JyhhWbgmpdAMkxzb'
    },
    tls: {
      rejectUnauthorized: false // 允许自签名证书
    }
  });
}

// 通过SUSTech邮件服务器发送邮件
async function sendEmailViaSustech(emailData) {
  const transporter = createSustechTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html
    });
    
    console.log('SUSTech邮件发送成功:', info.messageId);
    return info;
  } catch (error) {
    console.error('SUSTech邮件发送失败:', error);
    throw error;
  }
}

// 发送预约成功邮件
async function sendBookingSuccessEmail(name, email, combinedBooking) {
  const emailData = {
    from: 'designworkshop@sustech.edu.cn',
    to: email,
    subject: '预约成功确认 - SUSTech SD Workshop',
    html: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px;">
            <h1 style="color: #10b981; margin: 0; font-size: 24px;">✅ 预约成功</h1>
            <h2 style="color: #374151; margin: 10px 0 0 0; font-size: 18px; font-weight: normal;">SUSTech SD Workshop</h2>
          </div>
          
          <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10b981;">
            <h3 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">🎉 恭喜您，预约已成功！</h3>
            <p style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">亲爱的 <strong>${name}</strong>，</p>
            <p style="color: #374151; margin: 0; font-size: 16px;">您的设备预约已成功创建，请查看下方详细信息：</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">📋 预约详情</h4>
            
            <div style="background: #fff; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="font-weight: bold; color: #1e3a8a; font-size: 18px;">${combinedBooking.device}</span>
                <span style="color: #6b7280; font-size: 14px;">${combinedBooking.model || ''}</span>
              </div>
              <div style="color: #374151; font-size: 16px; line-height: 1.8;">
                <div>📅 <strong>日期：</strong>${combinedBooking.date}</div>
                <div>⏰ <strong>时间：</strong>${combinedBooking.start_time} - ${combinedBooking.end_time}</div>
                <div>📊 <strong>总时间段：</strong>${combinedBooking.total_slots} 个时间段</div>
                <div>⏱️ <strong>总时长：</strong>${combinedBooking.total_hours} 小时</div>
              </div>
            </div>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>📌 重要提醒：</strong>
            </p>
            <ul style="color: #92400e; margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
              <li>请按时到达预约地点</li>
              <li>如需取消预约，请使用预约管理功能</li>
              <li>如有疑问，请联系工作人员</li>
            </ul>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 12px; line-height: 1.6;">
            <p style="margin: 0 0 5px 0;">感谢您使用SUSTech SD Workshop预约系统！</p>
            <p style="margin: 0;">此邮件由系统自动发送，请勿回复。</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
            <p style="margin: 0; color: #9ca3af;">© 2025 南方科技大学 SD Workshop. 保留所有权利。</p>
          </div>
        </div>
      </div>
    `
  };

  // 使用SUSTech邮件服务器
  return await sendEmailViaSustech(emailData);
}

// 发送OTP邮件
async function sendOTPEmail(email, otp) {
  const emailData = {
    from: 'designworkshop@sustech.edu.cn',
    to: email,
    subject: '预约验证码 - SUSTech SD Workshop',
    html: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px;">
            <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">南方科技大学</h1>
            <h2 style="color: #374151; margin: 10px 0 0 0; font-size: 18px; font-weight: normal;">SD Workshop 预约系统</h2>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #1e3a8a;">
            <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 18px;">您的验证码</h3>
            <div style="background: #fff; padding: 25px; border-radius: 6px; text-align: center; border: 2px solid #e5e7eb;">
              <span style="font-size: 36px; font-weight: bold; color: #1e3a8a; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
            </div>
            <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 14px; text-align: center;">
              ⏰ 此验证码10分钟内有效，请勿泄露给他人
            </p>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>安全提示：</strong>请勿将验证码告诉他人，工作人员不会主动索要您的验证码。
            </p>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 12px; line-height: 1.6;">
            <p style="margin: 0 0 5px 0;">如果您没有请求此验证码，请忽略此邮件。</p>
            <p style="margin: 0;">此邮件由系统自动发送，请勿回复。</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
            <p style="margin: 0; color: #9ca3af;">© 2025 南方科技大学 SD Workshop. 保留所有权利。</p>
          </div>
        </div>
      </div>
    `
  };

  // 使用SUSTech邮件服务器
  return await sendEmailViaSustech(emailData);
}
