import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cautelasRouter from "./cautelas";
import authRouter from "./auth";
import motoristasRouter from "./motoristas";
import placasRouter from "./placas";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cautelasRouter);
router.use(authRouter);
router.use(motoristasRouter);
router.use(placasRouter);

export default router;
