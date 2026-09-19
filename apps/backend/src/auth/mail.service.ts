import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../config/env.validation';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  async sendPasswordResetCode(to: string, code: string, firstName: string): Promise<void> {
    const apiKey = this.configService.get('RESEND_API_KEY', { infer: true });
    if (!apiKey) {
      throw new ServiceUnavailableException('Email service is not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: this.configService.get('MAIL_FROM', { infer: true }),
        to: [to],
        subject: `${code} is your StyleForm verification code`,
        html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto">
          <p>Hi ${escapeHtml(firstName)},</p>
          <p>Use this code to reset your password. It expires in 10 minutes.</p>
          <p style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</p>
          <p style="color:#666;font-size:13px">If you didn't request this, you can ignore this email.</p>
        </div>`,
      }),
    });

    if (!response.ok) {
      this.logger.error(`Resend rejected the email (${response.status}): ${await response.text()}`);
      throw new ServiceUnavailableException('Could not send the email');
    }
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
