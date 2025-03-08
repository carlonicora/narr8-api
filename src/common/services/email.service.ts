import { Injectable } from "@nestjs/common";
import * as sendGridMail from "@sendgrid/mail";
import * as fs from "fs";
import * as Handlebars from "handlebars";
import { join } from "path";

interface EmailParams {
  to: string | string[];
  subject?: string;
  [key: string]: any;
}

@Injectable()
export class EmailService {
  private templateBasePath: string;

  constructor() {
    sendGridMail.setApiKey(process.env.EMAIL_SECRET_KEY as string);
    this.templateBasePath = join(process.cwd(), "templates", "email");
  }

  private loadTemplate(templateId: string, locale: string): string {
    let templatePath = join(this.templateBasePath, locale, `${templateId}.hbs`);
    if (!fs.existsSync(templatePath) && locale !== "en") {
      templatePath = join(this.templateBasePath, "en", `${templateId}.hbs`);
    }
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found for template "${templateId}" in locale "${locale}" or default "en".`);
    }
    return fs.readFileSync(templatePath, "utf8");
  }

  async sendEmail(templateId: string, emailParams: EmailParams, locale: string): Promise<void> {
    const templateContent = this.loadTemplate(templateId, locale);
    const template = Handlebars.compile(templateContent);
    const html = template(emailParams);

    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const extractedTitle = titleMatch ? titleMatch[1] : "";
    const to = emailParams.to;
    const subject = emailParams.subject || extractedTitle;

    const mailOptions = {
      to,
      from: process.env.EMAIL_FROM,
      subject,
      text: html,
      html,
    };

    try {
      await sendGridMail.send(mailOptions);
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
}
