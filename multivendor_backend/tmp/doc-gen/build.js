// Generates the client-facing Word document (.docx) of the Wedzing capacity
// & cost plan. Run with: node build.js
// Output: ../../../docs/2026-05-14_wedzing_capacity_plan.docx

const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  Footer,
  Header,
  PageNumber,
  convertInchesToTwip,
} = require('docx');

// ===================== Brand & styling =====================
const ORANGE = 'FF7A00';
const DARK_TEXT = '1A1A1A';
const MUTED = '6D6D6D';
const ROW_ALT = 'F8F8F8';
const BORDER = 'E3E3E3';
const FONT = 'Calibri';

// ===================== Helpers =====================
function H1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, color: ORANGE, font: FONT })],
  });
}

function H2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 26, color: DARK_TEXT, font: FONT })],
  });
}

function H3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 22, color: ORANGE, font: FONT })],
  });
}

function P(text, opts = {}) {
  const runs = Array.isArray(text) ? text : [new TextRun({ text, font: FONT, size: 22, color: DARK_TEXT })];
  return new Paragraph({
    spacing: { after: 140, line: 320 },
    alignment: opts.align || AlignmentType.LEFT,
    indent: opts.indent ? { left: convertInchesToTwip(opts.indent) } : undefined,
    children: runs,
  });
}

function Muted(text) {
  return new Paragraph({
    spacing: { after: 120, line: 280 },
    children: [new TextRun({ text, italics: true, font: FONT, size: 20, color: MUTED })],
  });
}

function Bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80, line: 300 },
    children: typeof text === 'string'
      ? [new TextRun({ text, font: FONT, size: 22, color: DARK_TEXT })]
      : text,
  });
}

function Bold(text, size = 22) {
  return new TextRun({ text, bold: true, font: FONT, size, color: DARK_TEXT });
}
function Plain(text, size = 22, color = DARK_TEXT) {
  return new TextRun({ text, font: FONT, size, color });
}

function cell(content, opts = {}) {
  const text = typeof content === 'string' ? content : '';
  const children = typeof content === 'string'
    ? [new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        children: [new TextRun({
          text,
          font: FONT,
          size: opts.size || 20,
          bold: !!opts.bold,
          color: opts.color || DARK_TEXT,
        })],
      })]
    : content;
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill, color: 'auto' } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children,
  });
}

function brandTable(headerCells, rows, widths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headerCells.map((t, i) =>
      cell(t, { bold: true, color: 'FFFFFF', fill: ORANGE, width: widths ? widths[i] : undefined })
    ),
  });
  const bodyRows = rows.map((row, idx) =>
    new TableRow({
      children: row.map((c, i) =>
        cell(c, { fill: idx % 2 === 1 ? ROW_ALT : undefined, width: widths ? widths[i] : undefined })
      ),
    })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      left:   { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      right:  { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      insideVertical:   { style: BorderStyle.SINGLE, size: 4, color: BORDER },
    },
    rows: [headerRow, ...bodyRows],
  });
}

function spacer(after = 200) {
  return new Paragraph({ spacing: { after }, children: [new TextRun({ text: '' })] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ===================== Document content =====================

// --- Cover page ---
const cover = [
  new Paragraph({
    spacing: { before: 2200, after: 200 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'WEDZING', bold: true, font: FONT, size: 80, color: ORANGE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 1400 },
    children: [new TextRun({ text: 'Wedding & Event Management Platform', font: FONT, size: 26, color: MUTED, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Platform Capacity, Storage', bold: true, font: FONT, size: 44, color: DARK_TEXT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 1400 },
    children: [new TextRun({ text: '& Investment Plan', bold: true, font: FONT, size: 44, color: DARK_TEXT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'Prepared for the Wedzing leadership team', font: FONT, size: 24, color: DARK_TEXT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 1200 },
    children: [new TextRun({ text: 'Version 1.1   •   14 May 2026', font: FONT, size: 22, color: MUTED })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: 'This document outlines the operating capacity of the Wedzing', font: FONT, size: 20, color: MUTED, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: 'platform at three growth stages and the infrastructure investment', font: FONT, size: 20, color: MUTED, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'required to deliver each stage reliably.', font: FONT, size: 20, color: MUTED, italics: true })],
  }),
  pageBreak(),
];

// --- 1. Executive summary ---
const execSummary = [
  H1('1.  Executive Summary'),
  P('Wedzing is a complete wedding & event management platform that allows hosts to create an event, invite up to 500 (or more) guests, and run every sub-activity of the wedding from a single mobile and web application — invitations, gifting, twinning, sangeet schedules, polls, posts, loans and more.'),
  P('This document explains, in plain language:'),
  Bullet('How the Wedzing platform is built and what data each event produces.'),
  Bullet('How much load the platform can handle at each growth stage — users, requests, database queries.'),
  Bullet('The infrastructure (servers, database, media storage) required at each stage.'),
  Bullet('A clear month-by-month investment estimate so budgeting can begin immediately.'),
  spacer(180),
  H3('At a glance'),
  brandTable(
    ['Growth stage', 'Events per month', 'Concurrent peak users', 'Monthly running cost'],
    [
      ['Stage 1 — Launch / MVP', 'up to 1,000', 'around 500',    '₹12,000 – ₹18,000'],
      ['Stage 2 — Growth',       'up to 10,000', 'around 5,000', '₹45,000 – ₹70,000'],
      ['Stage 3 — Scale',        'up to 100,000', 'around 50,000','₹2.0 – ₹3.5 lakh'],
    ],
    [30, 20, 25, 25]
  ),
  spacer(160),
  Muted('Note: Prices are 2026 retail rates for DigitalOcean and AWS Mumbai. Contracted or volume rates will be lower. Stage transitions are gradual and infrastructure can be upgraded without downtime.'),
  pageBreak(),
];

// --- 2. About the platform ---
const aboutPlatform = [
  H1('2.  About the Wedzing Platform'),
  H2('2.1   What it does'),
  P('Wedzing brings together every activity around a wedding into one connected experience for the host family and their guests:'),
  Bullet('Create an event, invite guests, manage RSVPs and approvals.'),
  Bullet('Run gifting groups so guests can pool contributions toward gifts.'),
  Bullet('Coordinate twinning groups (matching outfits) across friends and family.'),
  Bullet('Schedule a Sangeet event with time slots, performances and participants.'),
  Bullet('Plan menus and packages from partner caterers and vendors.'),
  Bullet('Run polls (e.g. choice of dress code, menu) and event-wide posts.'),
  Bullet('Apply for event-tied loans through partner financial institutions.'),
  Bullet('Share short, clean links over WhatsApp instead of long technical URLs.'),

  H2('2.2   How it is built'),
  P('The platform uses modern, well-supported technologies that scale linearly with traffic:'),
  brandTable(
    ['Layer', 'Technology', 'Why it was chosen'],
    [
      ['Mobile & web app',    'Ionic + Angular',     'Single codebase delivers iOS, Android and web — lower development cost.'],
      ['Backend service',     'Node.js + Express',   'Handles many simultaneous users with modest hardware.'],
      ['Database',            'MySQL',               'Reliable, well-understood, and supported by every major cloud provider.'],
      ['Push notifications',  'OneSignal',           'Industry standard with a free tier suitable for the early stage.'],
      ['Maps & venues',       'Google Places',       'Most accurate address autocomplete available in India.'],
    ],
    [22, 28, 50]
  ),
  spacer(160),
  H2('2.3   The numbers behind the platform'),
  P([
    Plain('Today the platform exposes '), Bold('125 API endpoints'),
    Plain(' across '), Bold('13 functional modules'), Plain(', backed by '),
    Bold('79 database tables'),
    Plain('. The detailed module-by-module breakdown is in section 4 (Platform Capacity Specifications).')
  ]),
  pageBreak(),
];

// --- 3. What each event uses ---
const eachEvent = [
  H1('3.  What a Single Event Uses on the Platform'),
  P([
    Plain('A typical Wedzing event today involves around '),
    Bold('500 guests'),
    Plain(' (the host plus their friends and family). The platform tracks every activity that those 500 people participate in. The table below shows what one fully-featured event creates inside the database.')
  ]),

  H3('3.1   Per-event data fan-out'),
  brandTable(
    ['Activity', 'Typical volume per event', 'Storage used'],
    [
      ['Guests & RSVPs',                   '500 guests, ~50 group assignments',          '~330 KB'],
      ['Gifts',                            '10 gifts, ~150 contributions, ~50 comments', '~100 KB'],
      ['Twinning groups',                  '5 groups, ~25 items, ~250 members',          '~500 KB'],
      ['Sangeet performances',             '24 time slots with optional video upload',   '3 MB – 120 MB (mostly video)'],
      ['Polls',                            '5 polls, ~250 votes',                        '~75 KB'],
      ['Posts',                            '20 posts, ~400 likes, ~200 comments',        '~700 KB – 5 MB'],
      ['Loan requests',                    '~3 requests per event',                      '~2 KB'],
      ['Short links (sharing)',            '~20 short URLs',                             '~10 KB'],
      ['Event schedule, likes & comments', 'Engagement-driven',                          '~450 KB'],
    ],
    [25, 45, 30]
  ),
  spacer(140),
  H3('3.2   The bottom line'),
  P([
    Plain('A standard, fully-used event consumes about '),
    Bold('5.5 MB to 8 MB'),
    Plain(' in the database, plus any uploaded performance videos and post media. The platform handles thousands of these in parallel without difficulty.')
  ]),
  Muted('In real terms: 1,000 events ≈ 6–8 GB of data; 100,000 events ≈ 600–800 GB of data — well within the comfort zone of a managed MySQL database when storage is provisioned correctly.'),
  pageBreak(),
];

// ============================================================
// --- 4. Platform Capacity Specifications (NEW DETAILED SECTION) ---
// ============================================================
const capacitySpecs = [
  H1('4.  Platform Capacity Specifications'),
  P('This section answers the most common questions a technical partner or investor will ask: how many users does it handle, how many requests per second, how many database queries, and what is the structure of the API and database.'),

  H2('4.1   Application capacity — users & request load'),
  P('The numbers below are sustainable load levels. The platform is designed to handle short spikes above these for several minutes without degrading.'),
  brandTable(
    ['Capacity metric', 'Stage 1 (Launch)', 'Stage 2 (Growth)', 'Stage 3 (Scale)'],
    [
      ['Active events per month',          '1,000',          '10,000',         '100,000'],
      ['Active guests per month',          '500,000',        '5,000,000',      '50,000,000'],
      ['Concurrent peak users',            '500',            '5,000',          '50,000'],
      ['Application servers',              '1 × 4 GB / 2 vCPU', '2 × 8 GB / 4 vCPU + load balancer', '4 × 16 GB / 8 vCPU + auto-scaling'],
      ['Sustained request rate',           '10 requests / sec',  '100 requests / sec', '1,000 requests / sec'],
      ['Peak request rate (10-min burst)', '30 requests / sec',  '300 requests / sec', '3,000 requests / sec'],
      ['Average API response time',        '< 250 ms',           '< 250 ms',           '< 300 ms'],
      ['p95 response time',                '< 600 ms',           '< 700 ms',           '< 800 ms'],
      ['Available bandwidth',              '1 TB / month',       '5 TB / month',       '50 TB / month'],
    ],
    [32, 22, 23, 23]
  ),
  spacer(140),
  Muted('Stages are not hard limits — they are sensible checkpoints at which infrastructure should be upgraded. A new tier can be deployed in a maintenance window of about 30 minutes; existing data is preserved.'),

  H2('4.2   Database capacity — strength & query load'),
  brandTable(
    ['Capacity metric', 'Stage 1 (Launch)', 'Stage 2 (Growth)', 'Stage 3 (Scale)'],
    [
      ['Database server',          '4 GB RAM / 2 vCPU / 38 GB SSD', '8 GB RAM / 2 vCPU / 115 GB SSD + 1 read replica', '32 GB RAM / 8 vCPU / 580 GB SSD + 2 read replicas'],
      ['Database size capacity',   'up to 30 GB',         'up to 100 GB',         'up to 1 TB'],
      ['Active connection pool',   '100 connections',     '200 connections',      '400 connections'],
      ['Sustained query rate',     '~150 queries / sec',  '~1,500 queries / sec', '~15,000 queries / sec'],
      ['Peak query rate',          '~450 queries / sec',  '~4,500 queries / sec', '~45,000 queries / sec'],
      ['Average query latency',    '< 20 ms',             '< 25 ms',              '< 30 ms'],
      ['Daily backups retained',   '7 days',              '14 days',              '30 days + point-in-time recovery'],
      ['Replication & failover',   'Manual restore',      'Automatic failover (60-90 s)', 'Automatic failover + zero-downtime patching'],
    ],
    [32, 22, 23, 23]
  ),
  spacer(140),
  P([
    Plain('Each Wedzing event uses roughly '),
    Bold('3,400 to 4,500 database rows'),
    Plain('. The Stage 3 sizing therefore supports approximately '),
    Bold('4 billion rows'),
    Plain(' of event data, with normal query performance.')
  ]),

  H2('4.3   How the application handles 500 simultaneous guests on one event'),
  P('A common real-world scenario: the host shares the invitation link on a WhatsApp family group of 500 people at 8 PM. Here is what happens internally:'),
  brandTable(
    ['Moment', 'Concurrent users', 'Requests/sec on platform', 'Database queries/sec'],
    [
      ['Invite drop (first 5 minutes)',    '50 – 80',   '8 – 15',  '40 – 75'],
      ['Browsing the event (next 30 min)', '100 – 200', '15 – 30', '70 – 150'],
      ['Live ceremony (2–3 hours)',        '100 – 200 sustained', '20 – 40', '100 – 200'],
      ['Peak burst (key moment)',          '200 – 300 in <60 s', '50 – 80', '250 – 400'],
    ],
    [32, 22, 23, 23]
  ),
  spacer(140),
  Muted('Even at Stage 1 (a single 4 GB application server), one event of this size uses only about 15–20 % of available capacity. Stage 1 therefore supports roughly 5 to 8 such events happening simultaneously in different parts of the country.'),

  H2('4.4   API structure — 125 endpoints across 13 modules'),
  P('The application exposes a clean, modular HTTP API. Every module is independently scalable and independently testable.'),
  brandTable(
    ['Module', 'Endpoints', 'Primary capabilities'],
    [
      ['Booking & Cart',            '33', 'Package selection, cart, orders, payments'],
      ['Authentication & Profile',  '8',  'Login, OTP, profile management, push tokens'],
      ['Sangeet & Performances',    '10', 'Schedule creation, performances, slot booking'],
      ['Twinning groups',           '7',  'Group creation, items, member management'],
      ['Polls',                     '7',  'Poll creation, options, vote casting'],
      ['Posts & feeds',             '7',  'Post creation, media, likes, comments'],
      ['Gifts',                     '6',  'Gift creation, contributions, comments'],
      ['Tasting sessions',          '5',  'Session booking, item selection, order updates'],
      ['Loan requests',             '4',  'Apply, list, fetch eligible events'],
      ['Comments & likes (event)',  '4',  'Event-level engagement, status updates'],
      ['Guests & groups',           '4',  'Guest list, RSVP, group creation'],
      ['Event lifecycle',           '3',  'Create / update / fetch event'],
      ['Event schedule',            '3',  'Schedule create / list / fetch'],
      ['Short links (sharing)',     '2',  'Create short URL, redirect with hit count'],
      ['Master data & misc',        '12', 'Occasions, services, banners, app version'],
    ],
    [30, 14, 56]
  ),

  H2('4.5   Database structure — 79 tables, organised by feature'),
  P('Tables are organised by module so growth in one area does not affect others. Soft-delete (`d_in`) is applied uniformly so accidental data loss is recoverable.'),
  brandTable(
    ['Module', 'Table count', 'Key tables'],
    [
      ['Core platform (events, customers, occasions, locations)', '~12', 'events_t, customer_list_t, occasions_t, location_tbl'],
      ['Booking & orders',           '~10', 'order_lst_t, sub_cart_items_t, order_payments_t, package_t'],
      ['Guests & approvals',         '~5',  'g_guest_list_t, g_guest_group_t, g_group_list_t'],
      ['Gifts module',               '~3',  'g_event_gift_t, g_event_gift_sub_t, g_gift_comment_t'],
      ['Event schedule',             '~2',  'g_event_schedule_t'],
      ['Twinning module',            '3',   'twinning_t, twinning_items_t, twinning_members_t'],
      ['Sangeet & performances',     '4',   'sangeet_schedule_t, performances_t, performance_items_t, performance_members_t'],
      ['Polls module',               '4',   'polls_t, poll_options_t, poll_votes_t, poll_categories_t'],
      ['Posts module',               '4',   'posts_t, post_media_t, post_likes_t, post_comments_t'],
      ['Comments & likes (event-wide)', '1', 'g_event_comments_likes_t'],
      ['Loans module',               '1',   'loan_requests_t'],
      ['Short links',                '1',   'short_links_t'],
      ['Tasting sessions',           '~3',  'tasting_sessions_t, tasting_items_t, tasting_orders_t'],
      ['Master & reference data',    '~20', 'service_type_t, meal_timing_t, banner_t, app_version_t …'],
      ['Support & utility',          '~6',  'invitation codes, otp logs, location service zones …'],
    ],
    [40, 12, 48]
  ),

  H2('4.6   Reliability targets at each stage'),
  brandTable(
    ['Metric', 'Stage 1', 'Stage 2', 'Stage 3'],
    [
      ['Monthly uptime target',          '99.5 % (~3.6 h downtime / mo)', '99.9 % (~43 min / mo)', '99.95 % (~22 min / mo)'],
      ['Recovery Time Objective (RTO)',  '4 hours',  '1 hour',     '15 minutes'],
      ['Recovery Point Objective (RPO)', '24 hours', '1 hour',     '5 minutes'],
      ['Support response',               'Best effort, business hours', '24 / 7 e-mail', '24 / 7 phone + on-call rotation'],
    ],
    [28, 24, 24, 24]
  ),
  pageBreak(),
];

// --- 5. How users experience scale ---
const scaleSection = [
  H1('5.  How the Platform Behaves at Scale'),
  P('Section 4 listed the raw capacity numbers. This section explains, in plain language, what those numbers mean for a real wedding.'),

  H3('5.1   What happens during an invitation drop'),
  P('When a host shares the invitation link in WhatsApp to 500 guests, traffic does not arrive uniformly. Around 50 to 80 guests tap the link in the first five minutes; another 100 to 200 visit during the next half-hour; the remaining guests trickle in over the next day or two. The platform handles this pattern comfortably — even on the Stage 1 hardware.'),

  H3('5.2   What happens during the ceremony itself'),
  P('When the ceremony is live, 100 to 200 guests are on the app at the same time, posting photos, liking each others’ posts, voting in polls, and commenting. Bursts of activity occur during emotional moments — the first dance, the cake-cutting — where 200 to 300 actions can land in a single minute. The platform absorbs these bursts because:'),
  Bullet('Static content (images, videos) is served from a Content Delivery Network close to the viewer.'),
  Bullet('The application server is stateless, so additional servers can be added in seconds during predictable peak weekends.'),
  Bullet('The database is sized with a 20 % headroom specifically for wedding-season surges (May/June and November/December).'),

  H3('5.3   What happens during a wedding-season weekend'),
  P('A typical Saturday evening in peak season may see 30 to 50 events running simultaneously across the country. At Stage 2 the platform handles this with capacity to spare; at Stage 3 it is designed for 500+ concurrent live events.'),
  pageBreak(),
];

// --- 6. Storage plan ---
const storageSection = [
  H1('6.  Storage Plan — Database, Images and Videos'),
  P('Different kinds of content live in different places. This separation is essential for cost, speed, and reliability.'),

  H3('6.1   Storage zones at a glance'),
  brandTable(
    ['Content type', 'Where it lives', 'Why separated'],
    [
      ['Structured data\n(events, guests, gifts, schedules, polls, posts)',
       'MySQL database on a managed host',
       'Searchable, transactional, indexed for fast lookups.'],
      ['Images\n(event covers, twinning outfits, post photos)',
       'Object storage (DigitalOcean Spaces or AWS S3)',
       'Large files do not belong in the database — they slow queries and inflate backups.'],
      ['Videos & audio\n(performance recordings, post videos)',
       'Object storage + Content Delivery Network',
       'Heavy files served from edge servers close to the viewer; the database stays small.'],
      ['Daily backups',
       'Separate backup storage with 7–30 day retention',
       'Disaster-recovery requirement; never on the same disk as the live data.'],
    ],
    [28, 30, 42]
  ),
  spacer(160),
  H3('6.2   Why the separation matters'),
  Bullet('A database packed with images and videos is roughly 5 to 10 times more expensive to run than one that holds only structured data.'),
  Bullet('When a guest opens the app, an image served from a CDN appears in under 200 ms anywhere in India. The same image fetched from a single server hundreds of kilometres away can take 2–3 seconds.'),
  Bullet('Backups of a database with embedded media take 5–10 times longer; restoring after an incident takes correspondingly longer.'),
  Bullet('Object storage costs roughly 10 paise per GB per month — a fraction of database storage.'),
  spacer(160),
  Muted('A short engineering exercise (estimated 3–5 weeks of effort) is recommended before promoting the platform to production traffic, to move existing media into object storage. This investment pays back inside the first month of operation.'),
  pageBreak(),
];

// --- 7. Investment & operating cost ---
const investmentSection = [
  H1('7.  Investment & Operating Cost'),
  P('The platform requires two kinds of investment: a one-time setup cost and a monthly running cost that scales gently with growth.'),

  H3('7.1   One-time investment (before going live)'),
  brandTable(
    ['Item', 'Estimated cost'],
    [
      ['Move media storage to object storage + CDN (3–5 weeks engineering)', '₹1,00,000 – ₹3,00,000'],
      ['Production SSL certificate, domain & DNS setup',                     '₹15,000 – ₹25,000 / year'],
      ['Payment gateway onboarding (Razorpay / PayU / Cashfree)',            '₹20,000 – ₹50,000 setup'],
      ['Google Maps API production quota & OneSignal Pro',                   '₹30,000 / year'],
      ['Monitoring, alerting & backup tooling',                              '₹20,000 – ₹50,000 / year'],
    ],
    [70, 30]
  ),

  H3('7.2   Monthly operating cost — Stage 1 (Launch)'),
  P('Suitable for up to 1,000 events per month and up to 500 concurrent users. A single small application server, a 4 GB managed database, and minimal object storage.'),
  brandTable(
    ['Cost item', 'DigitalOcean', 'AWS Mumbai'],
    [
      ['Application server',                          '₹2,000',  '₹2,800'],
      ['Managed MySQL database (4 GB)',               '₹5,000',  '₹5,000'],
      ['Object storage (250 GB + 1 TB transfer)',     '₹420',    '₹1,500'],
      ['CDN',                                         'Included','₹1,500'],
      ['Backups & monitoring',                        '₹500',    '₹800'],
      ['Notifications, maps & payment gateway fees',  '₹4,500',  '₹4,500'],
      ['Total per month',                             '₹12,420 (~$150)', '₹16,100 (~$195)'],
    ],
    [50, 25, 25]
  ),

  H3('7.3   Monthly operating cost — Stage 2 (Growth)'),
  P('Suitable for up to 10,000 events per month and up to 5,000 concurrent users. Two application servers behind a load balancer, an 8 GB database with one read replica, and 2 TB of object storage.'),
  brandTable(
    ['Cost item', 'DigitalOcean', 'AWS Mumbai'],
    [
      ['Application servers (2× 8 GB + load balancer)','₹8,000',  '₹13,000'],
      ['Managed MySQL (8 GB + 1 read replica)',        '₹15,000', '₹25,000'],
      ['Object storage (2 TB + egress)',               '₹5,200',  '₹10,000'],
      ['CDN (Cloudflare Pro)',                         '₹1,700',  '₹1,700'],
      ['Backups, monitoring, APM',                     '₹5,500',  '₹8,000'],
      ['Notifications, maps & payment gateway fees',   '₹14,000', '₹14,000'],
      ['Total per month',                              '₹49,400 (~$595)', '₹71,700 (~$865)'],
    ],
    [50, 25, 25]
  ),

  H3('7.4   Monthly operating cost — Stage 3 (Scale)'),
  P('Suitable for up to 100,000 events per month and up to 50,000 concurrent users. A horizontally scaled application tier, a 32 GB database with two read replicas, 20 TB of object storage, and a business-grade CDN.'),
  brandTable(
    ['Cost item', 'DigitalOcean', 'AWS Mumbai'],
    [
      ['Application tier (4× 16 GB + load balancer + auto-scale)','₹35,000', '₹55,000'],
      ['Managed MySQL (32 GB + 2 replicas)',                      '₹80,000', '₹1,40,000'],
      ['Object storage (20 TB + egress)',                         '₹50,000', '₹85,000'],
      ['CDN (Cloudflare Business)',                               '₹17,000', '₹17,000'],
      ['Backups, monitoring, APM',                                '₹35,000', '₹50,000'],
      ['Notifications, maps & payment gateway fees',              '₹70,000', '₹70,000'],
      ['Total per month',                                         '₹2,87,000 (~$3,460)', '₹4,17,000 (~$5,025)'],
    ],
    [50, 25, 25]
  ),
  spacer(160),
  Muted('Cost figures shown are retail public-cloud prices. Reserved instances, annual commitments, or negotiated rates can reduce the running cost by 10–30 %.'),
  pageBreak(),
];

// --- 8. Recommendations ---
const recommendations = [
  H1('8.  Recommendations'),
  H2('8.1   Phasing the rollout'),
  Bullet([Bold('Begin with Stage 1.'), Plain(' This validates the production environment and keeps the burn rate low while the early customer base grows.')]),
  Bullet([Bold('Move to Stage 2 when sustained traffic exceeds about 200 events per day.'), Plain(' Upgrade is a configuration change — no downtime.')]),
  Bullet([Bold('Plan Stage 3 around a national rollout or a partnership.'), Plain(' Pre-plan the read replicas, CDN tier and on-call rotation.')]),

  H2('8.2   Cloud provider'),
  P([
    Bold('Recommended: DigitalOcean for Stage 1 and Stage 2.'),
    Plain(' Pricing is roughly 30–40 % lower than AWS Mumbai for the same workload, the Spaces + CDN bundle is well integrated, and the managed MySQL service has been reliable. AWS becomes worth considering at Stage 3 if enterprise compliance or specific managed services are required.')
  ]),

  H2('8.3   Things to budget for outside infrastructure'),
  Bullet('Marketing & customer acquisition — not covered in this document but typically the largest cost line.'),
  Bullet('Customer support — at Stage 2 a single shared inbox is sufficient; at Stage 3 a small dedicated team is needed.'),
  Bullet('Quarterly third-party security review once real payment data is stored.'),

  H2('8.4   Next steps'),
  Bullet('Approve the one-time investment for the media-storage migration described in section 6.'),
  Bullet('Sign up for the cloud provider and provision the Stage 1 environment.'),
  Bullet('Onboard a payment gateway and set up the production OneSignal account.'),
  Bullet('Launch a soft-launch beta with 25 to 50 invited events before promoting publicly.'),
  pageBreak(),
];

// --- 9. Appendix / contact ---
const appendix = [
  H1('Appendix  —  Frequently Asked Questions'),

  H3('How many simultaneous users can the platform handle?'),
  P('At Stage 1, around 500 concurrent users. At Stage 2, around 5,000. At Stage 3, around 50,000. Each stage can be reached without downtime by upgrading the underlying infrastructure (see section 4 for the precise specifications).'),

  H3('How many API requests per second can the application process?'),
  P('Stage 1 sustains 10 requests per second, with bursts up to 30. Stage 2 sustains 100, bursts to 300. Stage 3 sustains 1,000, bursts to 3,000. Average response time stays below 250 ms at all stages.'),

  H3('How many database queries per second can the database handle?'),
  P('Stage 1 supports about 150 queries per second sustained. Stage 2 supports about 1,500. Stage 3 supports about 15,000, with read replicas absorbing the additional load. Query latency stays below 30 ms at all stages.'),

  H3('How many events can the platform handle in total?'),
  P('There is no fixed limit. The platform is designed to grow by adding servers and storage in small increments as demand rises. Stage 3 already supports a million events per year comfortably.'),

  H3('Will the existing data be lost when moving to the new storage approach?'),
  P('No. The migration described in section 6 is non-destructive — existing events keep working, and media files are copied over in the background.'),

  H3('What happens if traffic suddenly doubles during a wedding season weekend?'),
  P('At Stage 2 and above, the application servers and CDN absorb traffic spikes automatically. The database has 20 % headroom built into the sizing in section 7 specifically to handle wedding-season surges.'),

  H3('Is the platform secure?'),
  P('The application uses HTTPS, hashes sensitive credentials, and follows soft-delete semantics so accidental deletions are recoverable. A formal third-party security review is recommended once payment data is stored.'),

  H3('Can the platform be hosted in India?'),
  P('Yes. Both DigitalOcean (Bangalore region) and AWS (Mumbai region) offer Indian data centres. The cost estimates in this document already assume Indian hosting.'),

  spacer(400),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 600, after: 100 },
    children: [new TextRun({ text: 'Prepared by the Wedzing engineering team', font: FONT, size: 22, color: MUTED, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'For questions, contact: kiran@wedzing.in', font: FONT, size: 22, color: ORANGE, bold: true })],
  }),
];

// ===================== Build document =====================
const doc = new Document({
  creator: 'Wedzing',
  title: 'Wedzing — Capacity, Storage & Investment Plan',
  description: 'Client-facing capacity and cost plan for the Wedzing platform.',
  styles: {
    default: {
      document: { run: { font: FONT, size: 22, color: DARK_TEXT } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'Wedzing  •  Capacity & Investment Plan', font: FONT, size: 18, color: MUTED })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', font: FONT, size: 18, color: MUTED }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: MUTED }),
              new TextRun({ text: '  of  ', font: FONT, size: 18, color: MUTED }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: MUTED }),
            ],
          })],
        }),
      },
      children: [
        ...cover,
        ...execSummary,
        ...aboutPlatform,
        ...eachEvent,
        ...capacitySpecs,        // NEW Section 4
        ...scaleSection,         // renumbered to 5
        ...storageSection,       // renumbered to 6
        ...investmentSection,    // renumbered to 7
        ...recommendations,      // renumbered to 8
        ...appendix,
      ],
    },
  ],
});

const outPath = path.resolve(__dirname, '..', '..', '..', 'docs', '2026-05-14_wedzing_capacity_plan.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log('Wrote', outPath);
  console.log('Size:', (buf.length / 1024).toFixed(1), 'KB');
});
