import { createWorker } from '../config/queue.js';
import { isTest } from '../config/env.js';

export const emailWorker = isTest ? null : createWorker('email', async (job) => {
  const { name, data } = job;
  console.log(`[Email Job] ${name}:`, data);

  switch (name) {
    case 'welcome':
      await sendWelcomeEmail(data.email, data.name);
      break;
    case 'invite':
      await sendInviteEmail(data.email, data.workspaceName, data.inviterName);
      break;
    case 'password-reset':
      await sendPasswordResetEmail(data.email, data.token);
      break;
    default:
      console.log(`Unknown email job: ${name}`);
  }
});

async function sendWelcomeEmail(email, name) {
  console.log(`Sending welcome email to ${email} for ${name}`);
}

async function sendInviteEmail(email, workspaceName, inviterName) {
  console.log(`Sending invite email to ${email} for ${workspaceName} from ${inviterName}`);
}

async function sendPasswordResetEmail(email, token) {
  console.log(`Sending password reset email to ${email}`);
}