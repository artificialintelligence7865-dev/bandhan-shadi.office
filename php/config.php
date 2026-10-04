<?php
/**
 * config.php - Edit these settings before deploying.
 */

// Email that receives new registrations / payment proofs (leave '' to disable email)
define('ADMIN_EMAIL', 'you@example.com');

// Sender address: use an address on YOUR domain (e.g. no-reply@yourdomain.com)
// so Hostinger's mail does not flag messages as spam.
define('MAIL_FROM', 'no-reply@yourdomain.com');

// Folders (relative to the site root, one level above /php)
define('ROOT_DIR',        dirname(__DIR__));
define('UPLOAD_PHOTOS',   ROOT_DIR . '/uploads/photos');
define('UPLOAD_PROOFS',   ROOT_DIR . '/uploads/payments');
define('DATA_DIR',        ROOT_DIR . '/data');   // CSV logs; protected by .htaccess

// Upload rules
define('MAX_UPLOAD_BYTES', 3 * 1024 * 1024);     // 3 MB
define('ALLOWED_MIME', [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
]);

// Simple anti-spam: max submissions per IP per hour
define('RATE_LIMIT_PER_HOUR', 8);
