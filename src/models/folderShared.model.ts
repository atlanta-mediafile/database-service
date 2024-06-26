import { DataTypes, Model } from "sequelize";
import sequelize from "../database/dbConnection";

interface FolderSharedAtributes {
    id: number | null;
    folder_id: string;
    user_id: string;
    status: boolean;
}

class FolderSharedModel
    extends Model<FolderSharedAtributes>
    implements FolderSharedAtributes
{
    id!: number | null;
    folder_id!: string;
    user_id!: string;
    status!: boolean;
}

FolderSharedModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        folder_id: {
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
        tableName: "folder_shared",
    }
);

export default FolderSharedModel;
