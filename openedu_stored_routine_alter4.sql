USE openedu;
SET collation_connection = utf8mb4_unicode_ci;

DELIMITER //

CREATE OR REPLACE FUNCTION set_access_token_attachments(p_id INT UNSIGNED, p_course_id_array JSON, p_email_array JSON) RETURNS JSON
BEGIN
	DECLARE v_course_id TEXT;
	DECLARE v_email TEXT;
	DECLARE v_diff JSON DEFAULT '{ "exclude_user_keys": [], "include_user_keys": [] }';
	DECLARE v_user_id INT UNSIGNED;
	
	IF p_course_id_array IS NOT NULL THEN
	
		FOR _token IN (SELECT course_id FROM access_token_course_attachments WHERE access_token_id = p_id) DO
			IF NOT JSON_CONTAINS(p_course_id_array, _token.course_id) THEN
				DELETE FROM access_token_course_attachments WHERE access_token_id = p_id AND course_id = _token.course_id;
			END IF;
		END FOR;
		
		FOR _index IN 0 .. JSON_LENGTH(p_course_id_array) - 1 DO
			SET v_course_id = JSON_VALUE(p_course_id_array, CONCAT('$[', _index, ']'));
			IF NOT EXISTS(SELECT 1 FROM access_token_course_attachments WHERE access_token_id = p_id AND course_id = v_course_id) THEN
				INSERT INTO access_token_course_attachments SET access_token_id = p_id, course_id = v_course_id;
			END IF;
		END FOR;
	
	END IF;
	
	IF p_email_array IS NOT NULL THEN
	
		FOR _token IN (SELECT email FROM access_token_user_attachments WHERE access_token_id = p_id) DO
			IF NOT JSON_CONTAINS(p_email_array, CONCAT('"', _token.email, '"')) THEN
				DELETE FROM access_token_user_attachments WHERE access_token_id = p_id AND email = _token.email;
				SET v_user_id = (SELECT id FROM users WHERE email = _token.email);
				IF v_user_id IS NOT NULL THEN
					SET v_diff = JSON_ARRAY_APPEND(v_diff, '$.exclude_user_keys', v_user_id);
				END IF;
			END IF;
		END FOR;
		
		FOR _index IN 0 .. JSON_LENGTH(p_email_array) - 1 DO
			SET v_email = JSON_VALUE(p_email_array, CONCAT('$[', _index, ']'));
			IF NOT EXISTS(SELECT 1 FROM access_token_user_attachments WHERE access_token_id = p_id AND email = v_email) THEN
				SET v_user_id = (SELECT id FROM users WHERE email = v_email);
				INSERT INTO access_token_user_attachments SET access_token_id = p_id, email = v_email, user_id = v_user_id;
				IF v_user_id IS NOT NULL THEN
					SET v_diff = JSON_ARRAY_APPEND(v_diff, '$.include_user_keys', v_user_id);
				END IF;
			END IF;
		END FOR;
	
	END IF;
	
	RETURN v_diff;		
END;

CREATE OR REPLACE TRIGGER user_after_create AFTER INSERT ON users FOR EACH ROW
BEGIN
	UPDATE access_token_user_attachments SET user_id = NEW.id WHERE email = NEW.email;
END;


//
DELIMITER ;