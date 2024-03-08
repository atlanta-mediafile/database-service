import { DataTypes, Model } from "sequelize";
import sequelize from "../database/dbConnection";

interface FolderAtributes {
    id: string;
    name: string;
    user_id: string;
    parent_id: string | null;
    created_date: Date;
    status: boolean;
}

class FolderModel extends Model<FolderAtributes> implements FolderAtributes {
    id!: string;
    name!: string;
    user_id!: string;
    parent_id!: string | null;
    created_date!: Date;
    status!: boolean;
}

FolderModel.init(
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
        parent_id: {
            type: DataTypes.UUID,
            allowNull: true,
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
        sequelize,
        tableName: 'folder'
    }
);

export default FolderModel;
