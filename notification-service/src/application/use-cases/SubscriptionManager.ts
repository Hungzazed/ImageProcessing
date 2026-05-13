import type { ISubscription } from "../../domain/entities/Subscription.js";
import { SubscriptionModel } from "../../infrastructure/database/models/Subscription.js";

export class SubscriptionManager {
  async createSubscription(data: ISubscription) {
    const subscription = new SubscriptionModel(data);
    return await subscription.save();
  }

  async getSubscriptions(filter: any) {
    return await SubscriptionModel.find(filter);
  }

  async deleteSubscription(id: string) {
    return await SubscriptionModel.findByIdAndDelete(id);
  }
}
