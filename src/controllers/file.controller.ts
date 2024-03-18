import { Request, Response } from "express";
import FileModel from "../models/file.model";
import FolderModel from "../models/folder.model";

class FileController {
    public create = async (req: Request, res: Response): Promise<Response> => {
        try {
            let errors = [];
            const {
                id,
                name,
                extension,
                mimeType,
                size,
                folderId,
                createdDate,
                status,
            } = req.body;
            const userId = req.params.userId;
            errors = this.validateFileData(
                id,
                name,
                extension,
                mimeType,
                size,
                folderId,
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
            const newFolder = await FileModel.create({
                id: id,
                name: name,
                user_id: userId,
                extension: extension,
                mime_type: mimeType,
                size: size,
                folder_id: folderId,
                created_date: createdDate,
                status: status,
            });
            if (newFolder) {
                return res.status(200).send({
                    errors: errors,
                    success: true,
                    data: newFolder,
                });
            }
            return res.status(500).send({
                errors: ["Failed to create file"],
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

    public get = async (req: Request, res: Response): Promise<Response> => {
        try {
            let errors = [];
            const userId = req.params.userId;
            const fildeId = req.params.fileId;
            errors = this.validateFileData(
                fildeId,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                userId,
                "get"
            );
            if (errors.length > 0) {
                return res.status(400).send({
                    errors: errors,
                    success: false,
                    data: null,
                });
            }
            const file = await FileModel.findOne({
                where: { id: fildeId, user_id: userId, status: true },
            });
            if (file) {
                return res.status(200).send({
                    errors: errors,
                    success: true,
                    data: file,
                });
            }
            return res.status(404).send({
                errors: ["File not found"],
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

    public moveToAnotherFolder = async (
        req: Request,
        res: Response
    ): Promise<Response> => {
        try {
            let errors = [];
            const userId = req.params.userId;
            const fildeId = req.params.fileId;
            const { folderId } = req.body;
            errors = this.validateFileData(
                fildeId,
                undefined,
                undefined,
                undefined,
                undefined,
                folderId,
                undefined,
                undefined,
                userId,
                "moveToAnotherFolder"
            );
            if (errors.length > 0) {
                return res.status(400).send({
                    errors: errors,
                    success: false,
                    data: null,
                });
            }
            const file = await FileModel.findOne({
                where: { id: fildeId, user_id: userId, status: true },
            });
            if (!file) {
                return res.status(404).send({
                    errors: ["File not found"],
                    success: false,
                    data: null,
                });
            }
            if (
                folderId === file.folder_id ||
                (folderId === "/" && file.folder_id === null)
            ) {
                return res.status(200).send({
                    errors: ["File is already in the specified folder"],
                    success: true,
                    data: file,
                });
            }
            if (folderId === "/") {
                const update = await file.update({ folder_id: null });
                if (update) {
                    return res.status(200).send({
                        errors: errors,
                        success: true,
                        data: update,
                    });
                }
                return res.status(500).send({
                    errors: ["Failed to move the file"],
                    success: false,
                    data: null,
                });
            }
            const folder = await FolderModel.findOne({
                where: { id: folderId, user_id: userId, status: true },
            });
            if (!folder) {
                return res.status(404).send({
                    errors: ["Folder not found"],
                    success: false,
                    data: null,
                });
            }
            const update = await file.update({ folder_id: folderId });
            if (update) {
                return res.status(200).send({
                    errors: errors,
                    success: true,
                    data: update,
                });
            }
            return res.status(500).send({
                errors: ["Failed to move the file"],
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
            const userId = req.params.userId;
            const fildeId = req.params.fileId;
            const { name } = req.body;
            errors = this.validateFileData(
                fildeId,
                name,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
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
            const file = await FileModel.findOne({
                where: { id: fildeId, user_id: userId, status: true },
            });
            if (!file) {
                return res.status(404).send({
                    errors: ["File not found"],
                    success: false,
                    data: null,
                });
            }
            if (file.name === name) {
                return res.status(409).send({
                    errors: ["File already has that name"],
                    success: false,
                    data: file,
                });
            }
            const update = await file.update({ name: name });
            if (update) {
                return res.status(200).send({
                    errors: errors,
                    success: true,
                    data: update,
                });
            }
            return res.status(500).send({
                errors: ["Failed to rename the file"],
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

    private validateFileData = (
        fildeId: any,
        name: any,
        extension: any,
        mimeType: any,
        size: any,
        folderId: any,
        createdDate: any,
        status: any,
        userId: any,
        method: string
    ): string[] => {
        const errors: string[] = [];
        if (!fildeId) {
            errors.push("Missing id");
        } else if (typeof fildeId !== "string") {
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
                if (!extension) {
                    errors.push("Missing extension");
                } else if (typeof extension !== "string") {
                    errors.push("Invalid extension");
                }
                if (!mimeType) {
                    errors.push("Missing mimeType");
                } else if (typeof mimeType !== "string") {
                    errors.push("Invalid mimeType");
                }
                if (!size) {
                    errors.push("Missing size");
                } else if (isNaN(parseInt(size))) {
                    errors.push("Invalid size");
                }
                if (folderId && typeof folderId !== "string") {
                    errors.push("Invalid folderId");
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
            case "get":
                break;
            case "moveToAnotherFolder":
                if (!folderId) {
                    errors.push("Missing folderId");
                } else if (typeof folderId !== "string") {
                    errors.push("Invalid folderId");
                }
                break;
            case "rename":
                if (!name) {
                    errors.push("Missing name");
                } else if (typeof name !== "string") {
                    errors.push("Invalid name");
                }
                break;
        }
        return errors;
    };
}

export default FileController;
