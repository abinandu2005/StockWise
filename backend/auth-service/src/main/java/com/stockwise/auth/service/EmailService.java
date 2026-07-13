package com.stockwise.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send general HTML email message.
     */
    public void sendHtmlEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "StockWise Admin");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            log.info("HTML email successfully sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Email sending failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Email sending failed: " + e.getMessage());
        }
    }

    /**
     * Send Account Verification OTP.
     */
    public void sendVerificationOtp(String to, String otp) {
        String subject = "Verify Your StockWise Account";
        String htmlContent = getOtpTemplate(
                "Verify Your Email",
                "Thank you for registering with StockWise. To complete your account setup and verify your email address, please use the 6-digit One-Time Password (OTP) below:",
                otp,
                "This OTP is valid for 10 minutes. If you did not request this verification, please ignore this email."
        );
        sendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * Send Forgot Password OTP.
     */
    public void sendPasswordResetOtp(String to, String otp) {
        String subject = "StockWise Password Reset OTP";
        String htmlContent = getOtpTemplate(
                "Reset Password Request",
                "We received a request to reset the password associated with your StockWise account. Please use the 6-digit One-Time Password (OTP) below to proceed with the password reset:",
                otp,
                "This OTP is valid for 10 minutes. For security reasons, do not share this code with anyone. If you did not request a password reset, please secure your account immediately."
        );
        sendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * Send Password Reset Success Notification.
     */
    public void sendPasswordResetSuccess(String to) {
        String subject = "Password Changed Successfully — StockWise";
        String htmlContent = getInfoTemplate(
                "Password Changed Successfully",
                "Your StockWise account password has been successfully changed.",
                "If you did not make this change, please contact your administrator immediately or reset your password again. We recommend reviewing your account for any unauthorized activity.",
                "✓ Password Updated"
        );
        sendHtmlEmail(to, subject, htmlContent);
    }

    // ── Private template helpers ──────────────────────────────────────

    private String getOtpTemplate(String title, String description, String otp, String footer) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "  <meta charset='utf-8'>" +
               "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
               "  <style>" +
               "    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }" +
               "    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); }" +
               "    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 20px; text-align: center; color: #ffffff; }" +
               "    .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; }" +
               "    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }" +
               "    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }" +
               "    .content h2 { color: #1e3c72; font-size: 20px; margin-top: 0; margin-bottom: 15px; }" +
               "    .content p { font-size: 16px; margin-top: 0; margin-bottom: 20px; }" +
               "    .otp-container { background-color: #f0f4f8; border: 2px dashed #2a5298; border-radius: 10px; padding: 25px; text-align: center; margin: 30px 0; }" +
               "    .otp-label { font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }" +
               "    .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #1e3c72; margin: 0; font-family: 'Courier New', monospace; }" +
               "    .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee; color: #777777; font-size: 13px; line-height: 1.5; }" +
               "  </style>" +
               "</head>" +
               "<body>" +
               "  <div class='container'>" +
               "    <div class='header'>" +
               "      <h1>StockWise</h1>" +
               "      <p>Inventory Management System</p>" +
               "    </div>" +
               "    <div class='content'>" +
               "      <h2>" + title + "</h2>" +
               "      <p>" + description + "</p>" +
               "      <div class='otp-container'>" +
               "        <div class='otp-label'>Your One-Time Password</div>" +
               "        <div class='otp-code'>" + otp + "</div>" +
               "      </div>" +
               "      <p style='font-size: 14px; color: #666666; font-style: italic;'>" + footer + "</p>" +
               "    </div>" +
               "    <div class='footer'>" +
               "      &copy; 2026 StockWise Admin. All rights reserved.<br>" +
               "      This is an automated system email — please do not reply directly." +
               "    </div>" +
               "  </div>" +
               "</body>" +
               "</html>";
    }

    private String getInfoTemplate(String title, String message, String warning, String badge) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "  <meta charset='utf-8'>" +
               "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
               "  <style>" +
               "    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }" +
               "    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); }" +
               "    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 20px; text-align: center; color: #ffffff; }" +
               "    .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; }" +
               "    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }" +
               "    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }" +
               "    .content h2 { color: #1e3c72; font-size: 20px; margin-top: 0; margin-bottom: 15px; }" +
               "    .badge { background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; border-radius: 8px; padding: 15px 25px; text-align: center; font-size: 18px; font-weight: 700; margin: 25px 0; }" +
               "    .warning-box { background-color: #fff8e1; border-left: 4px solid #f0ad4e; padding: 15px 20px; border-radius: 4px; font-size: 14px; color: #856404; margin-top: 20px; }" +
               "    .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee; color: #777777; font-size: 13px; line-height: 1.5; }" +
               "  </style>" +
               "</head>" +
               "<body>" +
               "  <div class='container'>" +
               "    <div class='header'>" +
               "      <h1>StockWise</h1>" +
               "      <p>Inventory Management System</p>" +
               "    </div>" +
               "    <div class='content'>" +
               "      <h2>" + title + "</h2>" +
               "      <p>" + message + "</p>" +
               "      <div class='badge'>" + badge + "</div>" +
               "      <div class='warning-box'>" + warning + "</div>" +
               "    </div>" +
               "    <div class='footer'>" +
               "      &copy; 2026 StockWise Admin. All rights reserved.<br>" +
               "      This is an automated system email — please do not reply directly." +
               "    </div>" +
               "  </div>" +
               "</body>" +
               "</html>";
    }
}
