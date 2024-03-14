import { Router } from "express";
import FileController from "../controllers/file.controller";

class FileRouter{
    private _router: Router;
    private fileController: FileController;

    constructor(){
        this._router = Router();
        this.fileController = new FileController();
        this.config();
    }

    private config(){
        this._router.post('/:userId/file', this.fileController.create);
        this._router.get('/:userId/file/:fileId', this.fileController.get);
    }

    public get router(){
        return this._router;
    }
}

export default FileRouter;