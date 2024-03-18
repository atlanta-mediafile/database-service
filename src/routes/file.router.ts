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
        this._router.patch('/:userId/file/:fileId', this.fileController.moveToAnotherFolder);
        this._router.put('/:userId/file/:fileId', this.fileController.rename);
    }

    public get router(){
        return this._router;
    }
}

export default FileRouter;