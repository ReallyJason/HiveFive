<?php
/**
 * HiveFive email utility — powered by Resend.
 *
 * Uses Resend's REST API (https://resend.com/docs) instead of PHP's
 * built-in mail(), which doesn't work in containerized environments
 * like Railway that lack a local MTA.
 *
 * The RESEND_API_KEY is baked into this constant at container startup
 * via docker-entrypoint.sh, or can be set directly here for local dev.
 */

if (!defined('RESEND_API_KEY')) {
    define('RESEND_API_KEY', getenv('RESEND_API_KEY') ?: '');
}

define('HIVEFIVE_FROM_EMAIL', 'HiveFive <no-reply@jasonhusoftware.com>');

/**
 * Send an email via Resend API.
 *
 * @param string $to      Recipient address
 * @param string $subject Email subject
 * @param string $html    HTML body
 * @return bool           true on success, false on failure
 */
function resend_send(string $to, string $subject, string $html): bool {
    $key = RESEND_API_KEY;
    if (!$key) {
        error_log('RESEND_API_KEY is not set — email not sent to ' . $to);
        return false;
    }

    $payload = json_encode([
        'from'    => HIVEFIVE_FROM_EMAIL,
        'to'     => [$to],
        'subject' => $subject,
        'html'    => $html,
    ]);

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $key,
            'Content-Type: application/json',
        ],
    ]);

    $response = curl_exec($ch);
    $status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log("Resend curl error: $error");
        return false;
    }

    if ($status < 200 || $status >= 300) {
        error_log("Resend API error (HTTP $status): $response");
        return false;
    }

    return true;
}

/**
 * Send a verification-code email.
 *
 * @param string $to        Recipient address
 * @param string $code      6-digit verification code
 * @param string $purpose   'signup' | 'email_change' | 'password_reset'
 * @return bool             true on success, false on failure
 */
function send_verification_email(string $to, string $code, string $purpose = 'signup'): bool {
    switch ($purpose) {
        case 'email_change':
            $subject = 'HiveFive - Verify your new email';
            $heading = 'Verify your new email address';
            $subtext = 'You requested an email change. Enter this code to confirm your new address:';
            break;
        case 'password_reset':
            $subject = 'HiveFive - Password Reset';
            $heading = 'Password Reset';
            $subtext = 'Enter this code to reset your password:';
            break;
        default: // signup
            $subject = 'HiveFive - Verify your account';
            $heading = 'Welcome to HiveFive!';
            $subtext = 'Enter this code to finish creating your account:';
            break;
    }

    $expiry_text = $purpose === 'password_reset' ? '1 hour' : '24 hours';

    $html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FEFDFB;font-family:Helvetica Neue,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEFDFB;padding:40px 0;">
    <tr><td align="center">
      <table width="420" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #ECEAE8;border-radius:12px;padding:40px;">
        <tr><td align="center">
          <div style="width:48px;height:48px;border-radius:10px;background:#E9A020;text-align:center;line-height:48px;font-weight:bold;font-size:22px;color:#131210;margin-bottom:24px;">H</div>
          <h1 style="margin:0 0 8px;font-size:22px;color:#131210;">' . $heading . '</h1>
          <p style="margin:0 0 28px;font-size:14px;color:#5C584F;">' . $subtext . '</p>
          <div style="background:#FEF9EE;border:2px solid #FBE0AA;border-radius:10px;padding:20px 32px;display:inline-block;margin-bottom:28px;">
            <span style="font-family:Courier New,monospace;font-size:36px;font-weight:bold;letter-spacing:10px;color:#131210;">' . $code . '</span>
          </div>
          <p style="margin:0;font-size:13px;color:#8C887F;">This code expires in ' . $expiry_text . '.<br>If you did not request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#BFBCB6;">HiveFive - Your campus marketplace</p>
    </td></tr>
  </table>
</body>
</html>';

    return resend_send($to, $subject, $html);
}
