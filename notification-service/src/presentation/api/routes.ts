import { Router } from "express";
import { SubscriptionController } from "./SubscriptionController.js";

export const routes = Router();
const controller = new SubscriptionController();

routes.post("/subscriptions", controller.create);
routes.get("/subscriptions", controller.list);
routes.delete("/subscriptions/:id", controller.delete);
