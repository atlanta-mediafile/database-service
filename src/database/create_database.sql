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

CREATE OR REPLACE FUNCTION verify_new_folder_is_child_of_current_folder(current_id UUID, new_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_child BOOLEAN;
    parent_folder_id UUID;
BEGIN
    is_child := FALSE;
    parent_folder_id := new_id;
    LOOP
        SELECT f.parent_id INTO parent_folder_id FROM folder f WHERE f.id = parent_folder_id;
        IF parent_folder_id IS NULL THEN
            EXIT;
        END IF;
        IF parent_folder_id = current_id THEN
            is_child := TRUE;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN is_child;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verify_folder_shared(folder_id_arg UUID, user_id_arg UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_folder_id UUID;
    found BOOLEAN;
BEGIN
    current_folder_id := folder_id_arg;
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM folder_shared
            WHERE folder_id = current_folder_id
            AND user_id = user_id_arg
            AND status = TRUE
        ) INTO found;

        IF found THEN
            RETURN TRUE;
        END IF;

        SELECT parent_id INTO current_folder_id FROM folder WHERE id = current_folder_id AND status = TRUE;

        IF current_folder_id IS NULL THEN
            RETURN FALSE;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
