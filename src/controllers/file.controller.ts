import { Request, Response } from "express";
import FileModel from "../models/file.model";
import FolderModel from "../models/folder.model";
import FileSharedModel from "../models/fileShared.model";
import sequelize from "../database/dbConnection";

class FileController {
    public create = async (req: Request, res: Response): Promise<Response> => {
        try {
            let errors = [];
            const { id, name, extension, mime_type, size, ip_location, created_date, status } =
                req.body;
            let { folder_id } = req.body;
            const userId = req.params.user_id;
            errors = this.validateFileData(
                id,
                name,
                extension,
                mime_type,
                size,
                folder_id,
                ip_location,
                created_date,
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
            if (folder_id) {
                const parentFolder = await FolderModel.findOne({
                    where: {
                        id: folder_id,
                        user_id: userId,
                        status: true,
                    },
                });
                if (!parentFolder) {
                    errors.push("Invalid folderId");
                    return res.status(400).send({
                        errors: errors,
                        success: false,
                        data: null,
                    });
                }
            }
            folder_id = folder_id === undefined ? null : folder_id;
            const alreadyFileNamed = await this.validateFileName(name, folder_id, userId);
            if (!alreadyFileNamed) {
                errors.push("A file with the same name already exists in that location");
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
                mime_type: mime_type,
                size: size,
                folder_id: folder_id,
                ip_location: ip_location,
                created_date: created_date,
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
            const userId = req.params.user_id;
            const fildeId = req.params.file_id;
            errors = this.validateFileData(
                fildeId,
                undefined,
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
            const isSharedFile = await FileSharedModel.findOne({
                where: { file_id: fildeId, user_id: userId, status: true },
            });
            if (isSharedFile) {
                const sharedFile = await FileModel.findOne({
                    where: { id: fildeId, status: true },
                });
                if (sharedFile) {
                    return res.status(200).send({
                        errors: errors,
                        success: true,
                        data: sharedFile,
                    });
                }
            }
            const anotherUserFile = await FileModel.findOne({
                where: {
                    id: fildeId,
                    status: true,
                },
            });
            if (anotherUserFile) {
                const isSharedFolder = (await sequelize.query(
                    `SELECT verify_folder_shared(:folderId, :userId) AS result`,
                    {
                        replacements: {
                            folderId: anotherUserFile.folder_id,
                            userId: userId,
                        },
                    }
                )) as { result: boolean }[][];
                if (isSharedFolder[0][0].result) {
                    return res.status(200).send({
                        errors: errors,
                        success: true,
                        data: anotherUserFile,
                    });
                }
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

    public moveToAnotherFolder = async (req: Request, res: Response): Promise<Response> => {
        try {
            let errors = [];
            const userId = req.params.user_id;
            const fildeId = req.params.file_id;
            const folderId = req.body.folder_id;
            errors = this.validateFileData(
                fildeId,
                undefined,
                undefined,
                undefined,
                undefined,
                folderId,
                undefined,
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
            if (folderId === file.folder_id || (folderId === "/" && file.folder_id === null)) {
                return res.status(200).send({
                    errors: ["File is already in the specified folder"],
                    success: true,
                    data: file,
                });
            }
            if (folderId === "/") {
                const alreadyFileNamed = await this.validateFileName(file.name, null, userId);
                if (!alreadyFileNamed) {
                    errors.push("A file with the same name already exists in that location");
                    return res.status(400).send({
                        errors: errors,
                        success: false,
                        data: null,
                    });
                }
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
            const alreadyFileNamed = await this.validateFileName(file.name, folder.id, userId);
            if (!alreadyFileNamed) {
                errors.push("A file with the same name already exists in that location");
                return res.status(400).send({
                    errors: errors,
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
            const userId = req.params.user_id;
            const fildeId = req.params.file_id;
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
            const alreadyFileNamed = await this.validateFileName(name, file.folder_id, userId);
            if (!alreadyFileNamed) {
                errors.push("A file with the same name already exists in that location");
                return res.status(400).send({
                    errors: errors,
                    success: false,
                    data: null,
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

    public delete = async (req: Request, res: Response): Promise<Response> => {
        try {
            let errors = [];
            const userId = req.params.user_id;
            const fileId = req.params.file_id;
            errors = this.validateFileData(
                fileId,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
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
            const file = await FileModel.findOne({
                where: {
                    id: fileId,
                    user_id: userId,
                    status: true,
                },
            });
            if (!file) {
                return res.status(404).send({
                    errors: ["File not found"],
                    success: false,
                    data: null,
                });
            }
            const update = await file.update({ status: false });
            if (update) {
                return res.status(200).send({
                    errors: errors,
                    success: true,
                    data: update,
                });
            }
            return res.status(500).send({
                errors: ["Failed to delete file"],
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

    public share = async (req: Request, res: Response): Promise<Response> => {
        try {
            let errors = [];
            const userId = req.params.user_id;
            const fileId = req.params.file_id;
            const { users } = req.body;
            errors = this.validateFileData(
                fileId,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                userId,
                "share"
            );
            if (!Array.isArray(users)) {
                errors.push("Invalid user ids");
            }
            for (const user of users) {
                if (typeof user !== "string" || user.length === 0) {
                    errors.push("Invalid user ids");
                    break;
                }
            }
            if (errors.length > 0) {
                return res.status(400).send({
                    errors: errors,
                    success: false,
                    data: null,
                });
            }
            const file = await FileModel.findOne({
                where: {
                    id: fileId,
                    user_id: userId,
                    status: true,
                },
            });
            if (!file) {
                return res.status(404).send({
                    errors: ["File not found"],
                    success: false,
                    data: null,
                });
            }
            var newRows = [];
            var updateStatusRows = [];
            var alreadyFileShared = [];
            var errorIds: string[] = [];
            for (const id of users) {
                const fileShared = await FileSharedModel.findOne({
                    where: { file_id: fileId, user_id: id },
                });
                if (fileShared) {
                    if (!fileShared.status) {
                        const update = await fileShared.update({
                            status: true,
                        });
                        if (update) {
                            updateStatusRows.push(update);
                        } else {
                            errorIds.push(id);
                        }
                    } else {
                        alreadyFileShared.push(fileShared);
                    }
                    continue;
                }
                const newFileShared = await FileSharedModel.create({
                    file_id: fileId,
                    user_id: id,
                    status: true,
                });
                if (newFileShared) {
                    newRows.push(newFileShared);
                } else {
                    errorIds.push(id);
                }
            }
            if (errorIds.length > 0) {
                return res.status(500).send({
                    errors: ["Failed to create all fileShared"],
                    success: false,
                    data: {
                        "created fileShared": newRows,
                        "updated fileShared": updateStatusRows,
                        "already fileShared": alreadyFileShared,
                        "userIds failed fileShared": errorIds,
                    },
                });
            }
            return res.status(200).send({
                errors: errors,
                success: true,
                data: {
                    "created fileShared": newRows,
                    "updated fileShared": updateStatusRows,
                    "already fileShared": alreadyFileShared,
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

    private validateFileData = (
        fildeId: any,
        name: any,
        extension: any,
        mimeType: any,
        size: any,
        folderId: any,
        ipLocation: any,
        createdDate: any,
        status: any,
        userId: any,
        method: string
    ): string[] => {
        const errors: string[] = [];
        const regExpUUID = new RegExp(
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        );
        if (!fildeId) {
            errors.push("Missing id");
        } else {
            if (typeof fildeId !== "string") {
                errors.push("Invalid id");
            } else if (!regExpUUID.test(fildeId)) {
                errors.push("Invalid id");
            }
        }
        if (!userId) {
            errors.push("Missing userId");
        } else {
            if (typeof userId !== "string") {
                errors.push("Invalid userId");
            } else if (!regExpUUID.test(userId)) {
                errors.push("Invalid userId");
            }
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
                if (folderId) {
                    if (typeof folderId !== "string") {
                        errors.push("Invalid folderId");
                    } else if (!regExpUUID.test(folderId)) {
                        errors.push("Invalid folderId");
                    }
                }
                if (!ipLocation) {
                    errors.push("Missing ipLocation");
                } else if (typeof ipLocation !== "string") {
                    errors.push("Invalid ipLocation");
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
                } else if (folderId === "/") {
                    break;
                } else {
                    if (typeof folderId !== "string") {
                        errors.push("Invalid folderId");
                    } else if (!regExpUUID.test(folderId)) {
                        errors.push("Invalid folderId");
                    }
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
            case "share":
                break;
        }
        return errors;
    };

    private validateFileName = async (
        name: string,
        folderId: any,
        userId: string
    ): Promise<boolean> => {
        const alreadyFileNamed = await FileModel.findOne({
            where: {
                name: name,
                folder_id: folderId,
                user_id: userId,
                status: true,
            },
        });
        return alreadyFileNamed === null;
    };
}

export default FileController;
