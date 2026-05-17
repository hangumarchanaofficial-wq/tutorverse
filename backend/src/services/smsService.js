/**
 * Best-effort SMS via SNS. Order placement does not fail if SMS fails;
 * failures are recorded in sms_logs for ops follow-up.
 */
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { env } from "../config/env.js";

const snsClient = new SNSClient({
  region: env.awsRegion,
  credentials:
    env.awsAccessKeyId && env.awsSecretAccessKey
      ? {
          accessKeyId: env.awsAccessKeyId,
          secretAccessKey: env.awsSecretAccessKey,
        }
      : undefined,
});

export async function sendSms(phone, message) {
  if (!phone || !message) {
    return { ok: false, reason: "Missing phone or message" };
  }

  try {
    const command = new PublishCommand({
      Message: message,
      PhoneNumber: phone,
      MessageAttributes: {
        "AWS.SNS.SMS.SenderID": {
          DataType: "String",
          StringValue: env.awsSnsSenderId,
        },
      },
    });
    const result = await snsClient.send(command);
    return { ok: true, providerMessageId: result.MessageId };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}
