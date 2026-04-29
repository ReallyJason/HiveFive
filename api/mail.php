<?php
/**
 * HiveFive email utility.
 *
 * Uses PHP's built-in mail() function. The server must have a working MTA
 * (sendmail / postfix / msmtp). If mail() is unavailable or fails, the
 * function returns false so callers can degrade gracefully.
 *
 * NOTE: Avoid em-dashes, curly quotes, HTML entities, and quoted font names
 * in the template — the CSE aptitude MTA silently drops emails containing
 * certain special characters.
 */

define('HIVEFIVE_FROM_EMAIL', 'hivefive@cse.buffalo.edu');
define('HIVEFIVE_FROM_NAME',  'HiveFive');

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

    $headers  = "From: " . HIVEFIVE_FROM_NAME . " <" . HIVEFIVE_FROM_EMAIL . ">\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    return @mail($to, $subject, $html, $headers);
}
