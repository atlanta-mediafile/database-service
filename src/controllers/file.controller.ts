import { Request, Response } from "express";
import FileModel from "../models/file.model";

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
        switch (method) {
            case "create":
                if (!fildeId) {
                    errors.push("Missing id");
                } else if (typeof fildeId !== "string") {
                    errors.push("Invalid id");
                }
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
                if (!userId) {
                    errors.push("Missing userId");
                } else if (typeof userId !== "string") {
                    errors.push("Invalid userId");
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
        }
        return errors;
    };
}

export default FileController;
