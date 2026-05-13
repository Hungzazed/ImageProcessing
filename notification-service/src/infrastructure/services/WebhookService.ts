import axios from 'axios';

export class WebhookService {
  async send(url: string, payload: any): Promise<void> {
    try {
      await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
    } catch (error: any) {
      throw new Error(`Webhook failed: ${error.message}`);
    }
  }
}
