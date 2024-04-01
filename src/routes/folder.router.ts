import { Router } from "express";
import FolderController from "../controllers/folder.controller";

class FolderRouter{
    private _router: Router;
    private folderController: FolderController;

    constructor(){
        this._router = Router();
        this.folderController = new FolderController();
        this.config();
    }

    private config(){
        this._router.post('/:user_id/folder', this.folderController.create);
        this._router.put('/:user_id/folder/:folder_id', this.folderController.rename);
        this._router.delete('/:user_id/folder/:folder_id', this.folderController.delete);
        this._router.get('/:user_id/folder/:folder_id', this.folderController.getFilesAndFoldersFromAFolder);
        this._router.patch('/:user_id/folder/:folder_id', this.folderController.moveToAnotherFolder);
        this._router.post('/:user_id/folder/:folder_id', this.folderController.share);
    }

    public get router(){
        return this._router;
    }
}

export default FolderRouter;