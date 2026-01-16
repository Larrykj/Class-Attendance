import https from 'https';
import { URLSearchParams } from 'url';
import logger from '../config/logger';
import { User } from '../db/models';

export interface SmsPayload {
  to: string;
  message: string;
  senderId?: string;
}

export interface SmsProvider {
  sendSms: (payload: SmsPayload) => Promise<void>;
}

let provider: SmsProvider | null = null;

const AFRICAS_TALKING_API_KEY = process.env.AFRICASTALKING_API_KEY;
const AFRICAS_TALKING_USERNAME = process.env.AFRICASTALKING_USERNAME;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'CLASSATT';

if (AFRICAS_TALKING_API_KEY && AFRICAS_TALKING_USERNAME) {
  provider = {
    async sendSms(payload: SmsPayload): Promise<void> {
      const bodyParams = new URLSearchParams();
      bodyParams.append('username', AFRICAS_TALKING_USERNAME);
      bodyParams.append('to', payload.to);
      bodyParams.append('message', payload.message);
      const from = payload.senderId || SMS_SENDER_ID;
      if (from) {
        bodyParams.append('from', from);
      }

      const data = bodyParams.toString();

      await new Promise<void>((resolve, reject) => {
        const req = https.request(
          {
            hostname: 'api.africastalking.com',
            path: '/version1/messaging',
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(data),
              apiKey: AFRICAS_TALKING_API_KEY,
              Accept: 'application/json',
            },
          },
          (res) => {
            const chunks: Uint8Array[] = [];

            res.on('data', (chunk) => {
              chunks.push(chunk);
            });

            res.on('end', () => {
              const responseBody = Buffer.concat(chunks).toString('utf8');
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                logger.info(`Africa's Talking SMS sent to ${payload.to} with status ${res.statusCode}`);
                resolve();
              } else {
                logger.error(
                  `Africa's Talking SMS failed with status ${res.statusCode}: ${responseBody}`
                );
                reject(new Error(`Africa's Talking SMS failed with status ${res.statusCode}`));
              }
            });
          }
        );

        req.on('error', (error) => {
          logger.error("Africa's Talking SMS error:", error);
          reject(error);
        });

        req.write(data);
        req.end();
      });
    },
  };

  logger.info("SMS service configured with Africa's Talking provider from environment variables");
}

export const configureSmsProvider = (customProvider: SmsProvider): void => {
  provider = customProvider;
};

export const sendSms = async (payload: SmsPayload): Promise<void> => {
  if (!provider) {
    logger.info(`SMS placeholder - would send to ${payload.to}: ${payload.message}`);
    return;
  }

  await provider.sendSms(payload);
};

const formatKenyanPhoneNumber = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  if (digits.startsWith('0')) {
    return `+254${digits.substring(1)}`;
  }

  if (digits.startsWith('254')) {
    return `+${digits}`;
  }

  if (digits.startsWith('7') || digits.startsWith('1')) {
    return `+254${digits}`;
  }

  if (raw.startsWith('+')) {
    return raw;
  }

  return `+${digits}`;
};

export const notifyParentOnAbsent = async (studentId: number, date: string): Promise<void> => {
  try {
    const student = (await User.findByPk(studentId, {
      include: [
        {
          model: User,
          as: 'parents',
          attributes: ['id', 'firstName', 'lastName', 'phoneNumber'],
          required: false,
          where: { role: 'parent' },
        },
      ],
    })) as any;

    if (!student) {
      logger.warn(`notifyParentOnAbsent: student ${studentId} not found`);
      return;
    }

    const parents: any[] = student.parents || [];
    if (!parents.length) {
      logger.warn(`notifyParentOnAbsent: no parents linked to student ${studentId}`);
      return;
    }

    const dateLabel = date;

    for (const parent of parents) {
      if (!parent.phoneNumber) {
        logger.warn(`notifyParentOnAbsent: parent ${parent.id} has no phone number`);
        continue;
      }

      const msisdn = formatKenyanPhoneNumber(parent.phoneNumber);
      if (!msisdn) {
        logger.warn(
          `notifyParentOnAbsent: invalid phone number for parent ${parent.id}: ${parent.phoneNumber}`
        );
        continue;
      }

      const message = `Hello ${parent.firstName}, your child ${student.firstName} was marked absent on ${dateLabel}.`;
      await sendSms({
        to: msisdn,
        message,
        senderId: SMS_SENDER_ID,
      });
    }
  } catch (error) {
    logger.error('notifyParentOnAbsent error:', error);
  }
};
