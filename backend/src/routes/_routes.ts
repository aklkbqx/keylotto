// backend/src/routes/_routes.ts
import Elysia from "elysia";
import Auth from "./auth"
import Datetime from "./datetime"
import Health from "./health"
import Profile from "./profile"
import Notifications from "./notifications"
import AdminRoute from "./admin/_routes"
import Lottery from "./lottery"

const app = new Elysia()
    .use(Health)
    .use(Datetime)
    .use(Auth)
    .use(Profile)
    .use(Notifications)
    .use(AdminRoute)
    .use(Lottery)

export default app