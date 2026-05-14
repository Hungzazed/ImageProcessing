import type { Request, Response } from "express";
import { SubscriptionManager } from "../../application/use-cases/SubscriptionManager.js";

export class SubscriptionController {
  private manager = new SubscriptionManager();

  create = async (req: Request, res: Response) => {
    try {
      const subscription = await this.manager.createSubscription(req.body);
      res.status(201).json(subscription);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      const filter = req.query;
      const subscriptions = await this.manager.getSubscriptions(filter);
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const result = await this.manager.deleteSubscription(id);
      if (!result) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json({ message: "Deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
