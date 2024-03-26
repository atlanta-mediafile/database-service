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
        this._router.post('/:userId/folder', this.folderController.create);
        this._router.put('/:userId/folder/:folderId', this.folderController.rename);
        this._router.delete('/:userId/folder/:folderId', this.folderController.delete);
        this._router.get('/:userId/folder/:folderId', this.folderController.getFilesAndFoldersFromAFolder);
        this._router.patch('/:userId/folder/:folderId', this.folderController.moveToAnotherFolder);
    }

    public get router(){
        return this._router;
    }
}

export default FolderRouter;