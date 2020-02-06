USE openedu;
SET collation_connection = utf8mb4_unicode_ci;

DELIMITER //

CREATE OR REPLACE TRIGGER course_pass_token_after_create AFTER INSERT ON course_pass_tokens FOR EACH ROW
BEGIN
	DECLARE v_email TEXT;
	FOR _index IN 0 .. JSON_LENGTH(NEW.emails) - 1 DO
		SET v_email = JSON_VALUE(NEW.emails, CONCAT('$[', _index, ']'));
		INSERT INTO user_pass_tokens (course_token_id, user_id, email) VALUES (NEW.id, (SELECT id FROM users WHERE email = v_email), v_email);
	END FOR;
END;

CREATE OR REPLACE TRIGGER course_pass_token_after_update AFTER UPDATE ON course_pass_tokens FOR EACH ROW
BEGIN
	DECLARE v_email TEXT;

	FOR _index IN 0 .. JSON_LENGTH(OLD.emails) - 1 DO
		SET v_email = JSON_VALUE(OLD.emails, CONCAT('$[', _index, ']'));
		IF NOT JSON_CONTAINS(NEW.emails, CONCAT('"', v_email, '"')) THEN
			DELETE FROM user_pass_tokens WHERE course_token_id = NEW.id AND email = v_email;
		END IF;
	END FOR;

	FOR _index IN 0 .. JSON_LENGTH(NEW.emails) - 1 DO
		SET v_email = JSON_VALUE(NEW.emails, CONCAT('$[', _index, ']'));
		IF NOT JSON_CONTAINS(OLD.emails, CONCAT('"', v_email, '"')) THEN
			INSERT INTO user_pass_tokens (course_token_id, user_id, email) VALUES (NEW.id, (SELECT id FROM users WHERE email = v_email), v_email) ON DUPLICATE KEY UPDATE course_token_id = NEW.id;
		END IF;
	END FOR;

END;

CREATE OR REPLACE TRIGGER user_after_create AFTER INSERT ON users FOR EACH ROW
BEGIN
	UPDATE user_pass_tokens SET user_id = NEW.id WHERE email = NEW.email;
END;

//
DELIMITER ;