import express, { Application, json } from "express";
import FolderRouter from "./routes/folder.router";
import sequelize from "./database/dbConnection";

class Server {
    private backend: Application;
    private folderRouter: FolderRouter;

    constructor() {
        this.backend = express();
        this.folderRouter = new FolderRouter();
        this.config();
        this.connectDatabase();
        this.route();
    }

    private config(): void {
        this.backend.set("port", process.env.PORT || 80);
        this.backend.use(json());
    }

    private async connectDatabase(): Promise<void> {
        try {
            // {force: true}
            await sequelize.sync();
            console.log("Connection has been established successfully.");
        } catch (error) {
            console.error("Unable to connect to the database:", error);
        }
    }

    private route = (): void => {
        this.backend.use("/user", this.folderRouter.router);
    };

    public start(): void {
        this.backend.listen(this.backend.get("port"), () => {
            console.log(`Server on port ${this.backend.get("port")}`);
        });
    }
}

const server = new Server();
server.start();
