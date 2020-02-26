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

CREATE OR REPLACE FUNCTION create_course_delivery_instance(p_template_id INT UNSIGNED, p_creator_id INT UNSIGNED, p_start_date DATETIME, p_enrollment_end_date DATETIME, p_price DECIMAL(11, 2)) RETURNS INT UNSIGNED
BEGIN
	DECLARE v_course_insert_id INT UNSIGNED;
	DECLARE v_section_insert_id INT UNSIGNED;
	DECLARE v_subsection_insert_id INT UNSIGNED;
	
	IF (SELECT COUNT(1) FROM course_design_units WHERE subsection_id IN (
		SELECT id FROM course_design_subsections WHERE section_id IN (SELECT id FROM course_design_sections WHERE course_id = p_template_id)
	) AND data_value_id IS NULL) > 0 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot create course delivery instance, because one or more of its units has data_value_id is set to NULL';
	END IF;
	
	INSERT INTO course_delivery_instances (_name, summary_value_id, description_value_id, picture_value_id, logo_value_id, creator_id, _data, template_id, creation_date, start_date, enrollment_end_date, price, defunct) SELECT
		_name,
		_increase_value_total_attachments(summary_value_id),
		_increase_value_total_attachments(description_value_id),
		_increase_value_total_attachments(picture_value_id),
		_increase_value_total_attachments(logo_value_id),
		p_creator_id,
		_data,		
		p_template_id,
		NOW(),
		p_start_date,
		p_enrollment_end_date,
		p_price,
		FALSE
		
	FROM course_design_templates WHERE id = p_template_id;
	SET v_course_insert_id = LAST_INSERT_ID();
	
	FOR _current_section IN (SELECT id, _name, summary_value_id, sequence_number FROM course_design_sections WHERE course_id = p_template_id) DO
		
		INSERT INTO course_delivery_sections (course_id, _name, summary_value_id, sequence_number) VALUES (
			v_course_insert_id,
			_current_section._name,
			_increase_value_total_attachments(_current_section.summary_value_id),
			_current_section.sequence_number
		);
		SET v_section_insert_id = LAST_INSERT_ID();
		
		FOR _current_subsection IN (SELECT id, _name, summary_value_id, access_period, expiration_period, sequence_number FROM course_design_subsections WHERE section_id = _current_section.id) DO
			
			INSERT INTO course_delivery_subsections (section_id, _name, summary_value_id, access_date, expiration_date, sequence_number) VALUES (
				v_section_insert_id,
				_current_subsection._name,
				_increase_value_total_attachments(_current_subsection.summary_value_id),
				IF(_current_subsection.access_period IS NULL, NULL, DATE_ADD(p_start_date, INTERVAL _current_subsection.access_period DAY)),
				IF(_current_subsection.expiration_period IS NULL, NULL, DATE_ADD(p_start_date, INTERVAL _current_subsection.expiration_period DAY)),
				_current_subsection.sequence_number
			);
			SET v_subsection_insert_id = LAST_INSERT_ID();
			
			FOR _current_unit IN (SELECT subsection_id, _name, summary_value_id, _type, data_value_id, sequence_number FROM course_design_units WHERE subsection_id = _current_subsection.id) DO
				INSERT INTO course_delivery_units (subsection_id, _name, summary_value_id, _type, data_value_id, sequence_number) VALUES ( 
					v_subsection_insert_id,
					_current_unit._name,
					_increase_value_total_attachments(_current_unit.summary_value_id),
					_current_unit._type,
					_increase_value_total_attachments(_current_unit.data_value_id),
					_current_unit.sequence_number
				);
			END FOR;
			
		END FOR;
		
	END FOR;
	
	RETURN v_course_insert_id;
END

//
DELIMITER ;