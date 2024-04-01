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
        this._router.post('/:user_id/file', this.fileController.create);
        this._router.get('/:user_id/file/:file_id', this.fileController.get);
        this._router.patch('/:user_id/file/:file_id', this.fileController.moveToAnotherFolder);
        this._router.put('/:user_id/file/:file_id', this.fileController.rename);
        this._router.delete('/:user_id/file/:file_id', this.fileController.delete);
        this._router.post('/:user_id/file/:file_id', this.fileController.share);
    }

    public get router(){
        return this._router;
    }
}

export default FileRouter;