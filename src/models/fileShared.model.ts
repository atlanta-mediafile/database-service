import { DataTypes, Model } from "sequelize";
import sequelize from "../database/dbConnection";

interface FileSharedAtributes {
    id: number | null;
    file_id: string;
    user_id: string;
    status: boolean;
}

class FileSharedModel
    extends Model<FileSharedAtributes>
    implements FileSharedAtributes
{
    id!: number | null;
    file_id!: string;
    user_id!: string;
    status!: boolean;
}

FileSharedModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        file_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.UUID,
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
        tableName: "file_shared",
    }
);

export default FileSharedModel;
