import { DataTypes, Model } from "sequelize";
import sequelize from "../database/dbConnection";

interface FileAtributes {
    id: string;
    name: string;
    user_id: string;
    extension: string;
    mime_type: string;
    size: number;
    folder_id: string | null;
    ip_location: string;
    created_date: Date;
    status: boolean;
}

class FileModel extends Model<FileAtributes> implements FileAtributes {
    id!: string;
    name!: string;
    user_id!: string;
    extension!: string;
    mime_type!: string;
    size!: number;
    folder_id!: string | null;
    ip_location!: string;
    created_date!: Date;
    status!: boolean;
}

FileModel.init(
    {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        extension: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mime_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        folder_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        ip_location: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        created_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        sequelize,
        tableName: "file",
    }
);

export default FileModel;
