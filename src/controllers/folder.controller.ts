import { Request, Response } from "express";
import FolderModel from "../models/folder.model";

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

    private validateFolderData = (
        id: any,
        name: any,
        parentId: any,
        createdDate: any,
        status: any,
        userId: any,
        method: string
    ): string[] => {
        const errors: string[] = [];

        if (!id) {
            errors.push("Missing id");
        } else if (typeof id !== "string") {
            errors.push("Invalid id");
        }
        if (!name) {
            errors.push("Missing name");
        } else if (typeof name !== "string") {
            errors.push("Invalid name");
        }
        if (!userId) {
            errors.push("Missing userId");
        } else if (typeof userId !== "string") {
            errors.push("Invalid userId");
        }
        if (method === "create") {
            if (parentId) {
                if (typeof parentId !== "string") {
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
        }
        return errors;
    };
}

export default FolderController;
