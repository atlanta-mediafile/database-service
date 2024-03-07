import { DataTypes } from 'sequelize';
import sequelize from '../database/dbConnection';

const FolderModel = sequelize.define(
    'folder',
    {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        parent_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        created_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    },
    {
        tableName: 'folder',
        timestamps: true
    }
);

export default FolderModel;
