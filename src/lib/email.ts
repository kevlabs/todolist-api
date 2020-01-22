/*
 * Mail interface
 * Uses the singleton pattern so that only one instance is created for a single
 * set of config params. If the class has already been instantiated with config params then
 * the existing instance will be returned.
 */

// tslint:disable: import-name
import nodemailer from 'nodemailer';
// import SMTPTransport from 'nodemailer/lib/smtp-transport';
import Mail from 'nodemailer/lib/mailer';

export type EmailParams = {
  host: string,
  port: number,
  senderName: string,
  senderEmail: string,
  user: string,
  password: string,
  debug?: boolean,
};

export default class Email {

  private transporter: Mail | null = null;
  private static instances: Email[] = [];
  private static instanceEqualityChecks: (keyof EmailParams)[] = ['host', 'port', 'senderName', 'senderEmail', 'user', 'debug'];

  constructor(private params: EmailParams) {
    const existingInstance = Email.findInstance(params);
    if (existingInstance) return existingInstance;

    // nodemailer config options
    const { senderName, senderEmail, user, password, ...rest } = params;
    const transportParams = { ...rest, auth: { user, pass: password }, secure: params.port === 465, pool: true };
    // create a transport instance
    this.transporter = nodemailer.createTransport(transportParams);

    // bind send method
    this.send = this.send.bind(this);

    Email.registerInstance(this);
  }

  private static findInstance(params: EmailParams): Email | undefined {
    return this.instances.find(
      (instance: Email): boolean => {
        return this.instanceEqualityChecks.every((param): boolean => instance.params[param] === params[param]);
      });
  }

  private static registerInstance(instance: Email): void {
    this.instances.push(instance);
  }

  /**
   * Send email
   * @param to email address string or object containing name and email of recipient. An array of these values can also be submitted
   * @param subject email subject.
   * @param body email content (text or HTML)
   * @param isHTML whether the body if HTML content - default is true
   * @return Promise resolving an object with send results (or array thereof if multiple recipients)
   */
  send(to: string | { name: string, address: string }, subject: string, body: string, isHTML?: boolean): Promise<any>;
  send(to: (string | { name: string, address: string })[], subject: string, body: string, isHTML?: boolean): Promise<any>;
  public async send(to: any, subject: string, body: string, isHTML = false): Promise<any> {
    try {

      const sendOptions: Mail.Options = {
        from: { name: this.params.senderName, address: this.params.senderEmail }, // sender address
        subject, // Subject line
      }

      isHTML && (sendOptions.html = body) || (sendOptions.text = body);

      // send emails individually vs using bcc which may be flagged as spam
      const toSend = to instanceof Array
      ? to.map(recipient => this.transporter.sendMail({ ...sendOptions, to: recipient }))
      : [this.transporter.sendMail({ ...sendOptions, to })];

      return await Promise.all(toSend);

    } catch (err) {
      throw Error('Failed to send email');
    }
  }

}
