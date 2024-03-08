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
                userId
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

    private validateFolderData = (
        id: any,
        name: any,
        parentId: any,
        createdDate: any,
        status: any,
        userId: any
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
        if (!userId) {
            errors.push("Missing userId");
        } else if (typeof userId !== "string") {
            errors.push("Invalid userId");
        }
        return errors;
    };
}

export default FolderController;
