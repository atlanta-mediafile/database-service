CREATE DATABASE mediafile;

\c mediafile

CREATE TABLE file (
    id UUID PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    extension VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    folder_id UUID,
    created_date TIMESTAMP NOT NULL,
    status BOOLEAN NOT NULL
);

CREATE TABLE folder (
    id UUID PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    parent_id UUID,
    created_date TIMESTAMP NOT NULL,
    status BOOLEAN NOT NULL
);

CREATE TABLE file_shared (
    id SERIAL PRIMARY KEY NOT NULL,
    file_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status BOOLEAN NOT NULL
);

CREATE TABLE folder_shared (
    id SERIAL PRIMARY KEY NOT NULL,
    folder_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status BOOLEAN NOT NULL
);
