import { Request, Response } from "express";
import FolderModel from "../models/folder.model";
import FileModel from "../models/file.model";

class FolderController {
    public create = async (req: Request, res: Response): Promise<Response> => {
        try {
            let errors = [];
            const { id, name, parentId, createdDate, status } = req.body;
            const userId = req.params.userId;
            errors = this.validateFolderData(
                id,
                name,
                parentId,
                createdDate,
                status,
                userId,
                "create"
            );
            if (errors.length > 0) {
                return res.status(400).send({
                    errors: errors,
                    success: false,
                    data: null,
                });
            }
            const newFolder = await FolderModel.create({
                id: id,
                name: name,
                parent_id: parentId,
                created_date: createdDate,
                status: status,
                user_id: userId,
            });
            if (newFolder) {
                return res.status(200).send({
                    errors: errors,
                    success: true,
                    data: newFolder,
                });
            }
            return res.status(500).send({
                errors: ["Failed to create folder"],
                success: false,
                data: null,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).send({
                errors: ["Internal server error", error],
                success: false,
                data: null,
            });
        }
    };

    public rename = async (req: Request, res: Response): Promise<Response> => {
        try {
            let errors = [];
            const { name } = req.body;
            const userId = req.params.userId;
            const folderId = req.params.folderId;
            errors = this.validateFolderData(
                folderId,
                name,
                null,
                null,
                null,
                userId,
                "rename"
            );
            if (errors.length > 0) {
                return res.status(400).send({
                    errors: errors,
                    success: false,
                    data: null,
                });
            }
            const folder = await FolderModel.findOne({
                where: {
                    id: folderId,
                    user_id: userId,
                },
            });
            if (!folder) {
                return res.status(404).send({
                    errors: ["Folder not found"],
                    success: false,
                    data: null,
                });
            }
            if (!folder.status) {
                return res.status(404).send({
                    errors: ["Folder is deleted"],
                    success: false,
                    data: null,
                });
            }
            if (folder.name === name) {
                return res.status(409).send({
                    errors: ["Folder already has that name"],
                    success: false,
                    data: folder,
                });
            }
            const update = await folder.update({ name: name });
            if (update) {
                return res.status(200).send({
                    errors: errors,
                    success: true,
                    data: update,
                });
            }
            return res.status(500).send({
                errors: ["Failed to rename folder"],
                success: false,
                data: null,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).send({
                errors: ["Internal server error", error],
                success: false,
                data: null,
            });
        }
    };

    public delete = async (req: Request, res: Response): Promise<Response> => {
        try {
            let errors = [];
            const userId = req.params.userId;
            const folderId = req.params.folderId;
            errors = this.validateFolderData(
                folderId,
                null,
                null,
                null,
                null,
                userId,
                "delete"
            );
            if (errors.length > 0) {
                return res.status(400).send({
                    errors: errors,
                    success: false,
                    data: null,
                });
            }
            const folder = await FolderModel.findOne({
                where: {
                    id: folderId,
                    user_id: userId,
                    status: true,
                },
            });
            if (!folder) {
                return res.status(404).send({
                    errors: ["Folder not found"],
                    success: false,
                    data: null,
                });
            }
            const update = await folder.update({ status: false });
            if (update) {
                return res.status(200).send({
                    errors: errors,
                    success: true,
                    data: update,
                });
            }
            return res.status(500).send({
                errors: ["Failed to delete folder"],
                success: false,
                data: null,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).send({
                errors: ["Internal server error", error],
                success: false,
                data: null,
            });
        }
    };

    public getFilesAndFoldersFromAFolder = async (
        req: Request,
        res: Response
    ): Promise<Response> => {
        try {
            let errors = [];
            const userId = req.params.userId;
            const folderId = req.params.folderId;
            errors = this.validateFolderData(
                folderId,
                null,
                null,
                null,
                null,
                userId,
                "getFilesAndFolderFromAFolder"
            );
            if (errors.length > 0) {
                return res.status(400).send({
                    errors: errors,
                    success: false,
                    data: null,
                });
            }
            const folder = await FolderModel.findOne({
                where: {
                    id: folderId,
                    user_id: userId,
                    status: true,
                },
            });
            if (!folder) {
                return res.status(404).send({
                    errors: ["Folder not found"],
                    success: false,
                    data: null,
                });
            }
            const folders = await FolderModel.findAll({
                where: {
                    parent_id: folderId,
                    user_id: userId,
                    status: true,
                },
            });
            const files = await FileModel.findAll({
                where: {
                    folder_id: folderId,
                    user_id: userId,
                    status: true,
                },
            });
            return res.status(200).send({
                errors: errors,
                success: true,
                data: {
                    files: files,
                    folders: folders,
                },
            });
        } catch (error) {
            console.log(error);
            return res.status(500).send({
                errors: ["Internal server error", error],
                success: false,
                data: null,
            });
        }
    };

    private validateFolderData = (
        folderId: any,
        name: any,
        parentId: any,
        createdDate: any,
        status: any,
        userId: any,
        method: string
    ): string[] => {
        const errors: string[] = [];

        if (!folderId) {
            errors.push("Missing id");
        } else if (typeof folderId !== "string") {
            errors.push("Invalid id");
        }
        if (!userId) {
            errors.push("Missing userId");
        } else if (typeof userId !== "string") {
            errors.push("Invalid userId");
        }

        switch (method) {
            case "create":
                if (!name) {
                    errors.push("Missing name");
                } else if (typeof name !== "string") {
                    errors.push("Invalid name");
                }
                if (parentId && typeof parentId !== "string") {
                    errors.push("Invalid parentId");
                }
                if (!createdDate) {
                    errors.push("Missing createdDate");
                } else {
                    const parsedDate = new Date(createdDate);
                    if (isNaN(parsedDate.getTime())) {
                        errors.push("Invalid createdDate");
                    }
                }
                if (!status) {
                    errors.push("Missing status");
                } else if (typeof status !== "boolean") {
                    errors.push("Invalid status");
                }
                break;

            case "rename":
                if (!name) {
                    errors.push("Missing name");
                } else if (typeof name !== "string") {
                    errors.push("Invalid name");
                }
                break;

            case "delete":
                break;
            case "getFilesAndFolderFromAFolder":
                break;
        }
        return errors;
    };
}

export default FolderController;
