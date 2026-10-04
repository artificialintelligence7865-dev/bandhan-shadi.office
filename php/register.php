<?php
/**
 * register.php - Handles the candidate registration form + photo upload.
 */
require_once __DIR__ . '/helpers.php';

require_post();
rate_limit();

$name         = clean('full_name', 80);
$age          = (int) ($_POST['age'] ?? 0);
$gender       = clean('gender', 10);
$marital      = clean('marital_status', 20);
$city         = clean('city', 60);
$phone        = clean('phone', 20);
$education    = clean('education', 80);
$occupation   = clean('occupation', 80);
$religion     = clean('religion_sect', 60);
$height       = clean('height', 20);
$requirements = clean('requirements', 1000);
$consent      = !empty($_POST['consent']);

// ---- Validation ----
if ($name === '' || $city === '' || $requirements === '') {
    json_response(false, 'Please fill in all required fields.', 422);
}
if ($age < 18 || $age > 80) {
    json_response(false, 'Age must be between 18 and 80.', 422);
}
if (!in_array($gender, ['Male', 'Female'], true)) {
    json_response(false, 'Please select a valid gender.', 422);
}
if (!in_array($marital, ['Never Married', 'Divorced', 'Widowed'], true)) {
    json_response(false, 'Please select a valid marital status.', 422);
}
if (!preg_match('/^[0-9+\-\s]{10,20}$/', $phone)) {
    json_response(false, 'Please enter a valid phone number.', 422);
}
if (!$consent) {
    json_response(false, 'Please accept the confirmation to continue.', 422);
}

// ---- Photo upload (validated, renamed randomly, stored in /uploads/photos) ----
$photo = save_image('photo', UPLOAD_PHOTOS, 'photo');

// ---- Save record ----
$ref = 'BSO-' . strtoupper(bin2hex(random_bytes(3)));
log_csv('registrations.csv', [
    date('Y-m-d H:i:s'), $ref, $name, $age, $gender, $marital, $city, $phone,
    $education, $occupation, $religion, $height, $requirements, $photo,
]);

notify_admin("New registration $ref - $name", implode("\n", [
    "Ref: $ref", "Name: $name", "Age: $age", "Gender: $gender", "Marital: $marital",
    "City: $city", "Phone: $phone", "Education: $education", "Occupation: $occupation",
    "Religion/Sect: $religion", "Height: $height", "Requirements: $requirements",
    "Photo file: uploads/photos/$photo",
]));

json_response(true, "Thank you, $name. Your registration is received (Ref: $ref). We will contact you soon.");
