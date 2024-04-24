import { Request, Response } from "express";
import FolderModel from "../models/folder.model";
import FileModel from "../models/file.model";
import sequelize from "../database/dbConnection";
import FolderSharedModel from "../models/folderShared.model";
import Sequelize from "sequelize";
import { QueryTypes } from "sequelize";

class FolderController {
    public create = async (req: Request, res: Response): Promise<Response> => {
        try {
            let errors = [];
            const { id, name, created_date, status } = req.body;
            let { parent_id } = req.body;
            const userId = req.params.user_id;
            errors = this.validateFolderData(
                id,
                name,
                parent_id,
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
            if (parent_id) {
                const parentFolder = await FolderModel.findOne({
                    where: {
                        id: parent_id,
                        user_id: userId,
                        status: true,
                    },
                });
                if (!parentFolder) {
                    errors.push("Invalid parentId");
                    return res.status(400).send({
                        errors: errors,
                        success: false,
                        data: null,
                    });
                }
            }
            parent_id = parent_id === undefined ? null : parent_id;
            const alreadyFolderNamed = await this.validateFolderName(name, parent_id, userId);
            if (!alreadyFolderNamed) {
                errors.push("A folder with the same name already exists in that location");
                return res.status(400).send({
                    errors: errors,
                    success: false,
                    data: null,
                });
            }
            const newFolder = await FolderModel.create({
                id: id,
                name: name,
                parent_id: parent_id,
                created_date: created_date,
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
            const userId = req.params.user_id;
            const folderId = req.params.folder_id;
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
            const alreadyFolderNamed = await this.validateFolderName(
                name,
                folder.parent_id,
                userId
            );
            if (!alreadyFolderNamed) {
                errors.push("A folder with the same name already exists in that location");
                return res.status(400).send({
                    errors: errors,
                    success: false,
                    data: null,
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
            const userId = req.params.user_id;
            const folderId = req.params.folder_id;
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
            const deletedFilesAndFolders = await sequelize.query(
                `SELECT delete_files_and_folders_from_a_folder(:folderId)`,
                {
                    replacements: {
                        folderId: folderId,
                    },
                }
            );
            if (!deletedFilesAndFolders) {
                return res.status(500).send({
                    errors: ["Failed to delete folder"],
                    success: false,
                    data: null,
                });
            }
            const deletedFilesAndFoldersIds: any[] = [];
            for (
                let index = 0;
                index < deletedFilesAndFolders[0].length;
                index++
            ) {
                const row: any = deletedFilesAndFolders[0][index];
                console.log(row.delete_files_and_folders_from_a_folder);
                deletedFilesAndFoldersIds.push(
                    row.delete_files_and_folders_from_a_folder
                );
            }
            return res.status(200).send({
                errors: [],
                success: true,
                data: {
                    deletedFilesAndFoldersIds: deletedFilesAndFoldersIds,
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

    public getFilesAndFoldersFromAFolder = async (
        req: Request,
        res: Response
    ): Promise<Response> => {
        try {
            let errors = [];
            const userId = req.params.user_id;
            const folderId = req.params.folder_id;
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
            if (folderId === "root") {
                const createdFolders = await FolderModel.findAll({
                    where: {
                        parent_id: null,
                        user_id: userId,
                        status: true,
                    },
                });
                const sharedFoldersQuery = `
                  SELECT f.*
                  FROM folder f
                  INNER JOIN folder_shared fs ON f.id = fs.folder_id
                  WHERE fs.user_id = :userId AND f.status = TRUE AND fs.status = TRUE;
                `;
                const sharedFolders = await sequelize.query(
                    sharedFoldersQuery,
                    {
                        replacements: { userId },
                        type: Sequelize.QueryTypes.SELECT,
                    }
                );
                const createdFiles = await FileModel.findAll({
                    where: {
                        user_id: userId,
                        folder_id: null,
                        status: true,
                    },
                });
                const sharedFilesQuery = `
                  SELECT f.*
                  FROM file f
                  INNER JOIN file_shared fs ON f.id = fs.file_id
                  WHERE fs.user_id = :userId AND f.status = TRUE AND fs.status = TRUE;
                `;
                const sharedFiles = await sequelize.query(sharedFilesQuery, {
                    replacements: { userId },
                    type: Sequelize.QueryTypes.SELECT,
                });
                return res.status(200).send({
                    errors: errors,
                    success: true,
                    data: {
                        createdFolders: createdFolders,
                        sharedFolders: sharedFolders,
                        createdFiles: createdFiles,
                        sharedFiles: sharedFiles,
                    },
                });
            }
            const folder = await FolderModel.findOne({
                where: {
                    id: folderId,
                    user_id: userId,
                    status: true,
                },
            });
            var isShared: boolean = false;
            if (!folder) {
                const isSharedFolder = (await sequelize.query(
                    `SELECT verify_folder_shared(:folderId, :userId) AS result`,
                    {
                        replacements: {
                            folderId: folderId,
                            userId: userId,
                        },
                    }
                )) as { result: boolean }[][];
                if (isSharedFolder[0][0].result) {
                    isShared = true;
                } else {
                    return res.status(404).send({
                        errors: ["Folder not found"],
                        success: false,
                        data: null,
                    });
                }
            }
            var folders, files;
            if (isShared) {
                folders = await FolderModel.findAll({
                    where: {
                        parent_id: folderId,
                        status: true,
                    },
                });
                files = await FileModel.findAll({
                    where: {
                        folder_id: folderId,
                        status: true,
                    },
                });
            } else {
                folders = await FolderModel.findAll({
                    where: {
                        parent_id: folderId,
                        user_id: userId,
                        status: true,
                    },
                });
                files = await FileModel.findAll({
                    where: {
                        folder_id: folderId,
                        user_id: userId,
                        status: true,
                    },
                });
            }

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

    public moveToAnotherFolder = async (
        req: Request,
        res: Response
    ): Promise<Response> => {
        try {
            let errors = [];
            const userId = req.params.user_id;
            const currentFolderId = req.params.folder_id;
            const newFolderId = req.body.newFolderId;
            errors = this.validateFolderData(
                currentFolderId,
                null,
                newFolderId,
                null,
                null,
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
            const currentFolder = await FolderModel.findOne({
                where: { id: currentFolderId, user_id: userId, status: true },
            });
            if (!currentFolder) {
                return res.status(404).send({
                    errors: ["Folder not found"],
                    success: false,
                    data: null,
                });
            }
            if (
                newFolderId === currentFolder.parent_id ||
                (newFolderId === "/" && currentFolder.parent_id === null)
            ) {
                return res.status(200).send({
                    errors: ["Folder is already in the specified folder"],
                    success: true,
                    data: currentFolder,
                });
            }
            if (newFolderId === "/") {
                const update = await currentFolder.update({ parent_id: null });
                if (update) {
                    return res.status(200).send({
                        errors: errors,
                        success: true,
                        data: update,
                    });
                }
                return res.status(500).send({
                    errors: ["Failed to move the folder"],
                    success: false,
                    data: null,
                });
            }
            const newFolder = await FolderModel.findOne({
                where: { id: newFolderId, user_id: userId, status: true },
            });
            if (!newFolder) {
                return res.status(404).send({
                    errors: ["Folder not found"],
                    success: false,
                    data: null,
                });
            }
            const isChild = (await sequelize.query(
                `SELECT verify_new_folder_is_child_of_current_folder(:currentId, :newId) AS is_child`,
                {
                    replacements: {
                        currentId: currentFolderId,
                        newId: newFolderId,
                    },
                }
            )) as { is_child: boolean }[][];
            if (isChild[0][0].is_child) {
                return res.status(400).send({
                    errors: ["Cannot move a folder into one of its subfolders"],
                    success: false,
                    data: null,
                });
            }
            const update = await currentFolder.update({
                parent_id: newFolderId,
            });
            if (update) {
                return res.status(200).send({
                    errors: errors,
                    success: true,
                    data: update,
                });
            }
            return res.status(500).send({
                errors: ["Failed to move the folder"],
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
            const folderId = req.params.folder_id;
            const { users } = req.body;
            errors = this.validateFolderData(
                folderId,
                null,
                null,
                null,
                null,
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
            var newRows = [];
            var updateStatusRows = [];
            var alreadyFolderShared = [];
            var errorIds: string[] = [];
            for (const id of users) {
                const folderShared = await FolderSharedModel.findOne({
                    where: { folder_id: folderId, user_id: id },
                });
                if (folderShared) {
                    if (!folderShared.status) {
                        const update = await folderShared.update({
                            status: true,
                        });
                        if (update) {
                            updateStatusRows.push(update);
                        } else {
                            errorIds.push(id);
                        }
                    } else {
                        alreadyFolderShared.push(folderShared);
                    }
                    continue;
                }
                const newFolderShared = await FolderSharedModel.create({
                    folder_id: folderId,
                    user_id: id,
                    status: true,
                });
                if (newFolderShared) {
                    newRows.push(newFolderShared);
                } else {
                    errorIds.push(id);
                }
            }
            if (errorIds.length > 0) {
                return res.status(500).send({
                    errors: ["Failed to create all folderShared"],
                    success: false,
                    data: {
                        "created folderShared": newRows,
                        "updated folderShared": updateStatusRows,
                        "already folderShared": alreadyFolderShared,
                        "userIds failed folderShared": errorIds,
                    },
                });
            }
            return res.status(200).send({
                errors: errors,
                success: true,
                data: {
                    "created folderShared": newRows,
                    "updated folderShared": updateStatusRows,
                    "already folderShared": alreadyFolderShared,
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
        const regExpUUID = new RegExp(
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        );
        if (method !== "getFilesAndFolderFromAFolder") {
            if (!folderId) {
                errors.push("Missing id");
            } else {
                if (typeof folderId !== "string") {
                    errors.push("Invalid id");
                } else if (!regExpUUID.test(folderId)) {
                    errors.push("Invalid id");
                }
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
                if (parentId) {
                    if (typeof parentId !== "string") {
                        errors.push("Invalid parentId");
                    } else if (!regExpUUID.test(folderId)) {
                        errors.push("Invalid parentId");
                    }
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
                if (!folderId) {
                    errors.push("Missing id");
                } else {
                    if (typeof folderId !== "string") {
                        errors.push("Invalid id");
                    } else if (folderId !== "root") {
                        if (!regExpUUID.test(folderId)) {
                            errors.push("Invalid id");
                        }
                    }
                }
                break;
            case "share":
                break;
            case "moveToAnotherFolder":
                if (!parentId) {
                    errors.push("Missing new folder id");
                } else if (parentId === "/") {
                    break;
                } else {
                    if (typeof parentId !== "string") {
                        errors.push("Invalid new folder id");
                    } else if (!regExpUUID.test(parentId)) {
                        errors.push("Invalid new folder id");
                    }
                }
                break;
        }
        return errors;
    };

    private validateFolderName = async (
        name: string,
        folderId: any,
        userId: string
    ): Promise<boolean> => {
        const alreadyFolderNamed = await FolderModel.findOne({
            where: {
                name: name,
                parent_id: folderId,
                user_id: userId,
                status: true,
            },
        });
        return alreadyFolderNamed === null;
    };
}

export default FolderController;
