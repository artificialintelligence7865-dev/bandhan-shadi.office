<?php
/**
 * payment.php - Handles Easypaisa TID + payment screenshot submission.
 */
require_once __DIR__ . '/helpers.php';

require_post();
rate_limit();

$name   = clean('pay_name', 80);
$phone  = clean('pay_phone', 20);
$tid    = clean('tid', 30);
$amount = clean('amount_paid', 20);

if ($name === '' || $amount === '') {
    json_response(false, 'Please fill in all required fields.', 422);
}
if (!preg_match('/^[0-9+\-\s]{10,20}$/', $phone)) {
    json_response(false, 'Please enter a valid phone number.', 422);
}
if (!preg_match('/^[A-Za-z0-9\-]{6,30}$/', $tid)) {
    json_response(false, 'Please enter a valid Transaction ID (letters and numbers only).', 422);
}

$shot = save_image('screenshot', UPLOAD_PROOFS, 'payment');

$ref = 'PAY-' . strtoupper(bin2hex(random_bytes(3)));
log_csv('payments.csv', [date('Y-m-d H:i:s'), $ref, $name, $phone, $tid, $amount, $shot]);

notify_admin("New payment proof $ref - $name", implode("\n", [
    "Ref: $ref", "Name: $name", "Phone: $phone", "TID: $tid", "Amount: $amount",
    "Screenshot: uploads/payments/$shot",
]));

json_response(true, "Thank you. Your payment proof is received (Ref: $ref). We will verify it and contact you.");
