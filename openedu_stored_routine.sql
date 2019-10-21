USE openedu;
SET collation_connection = utf8mb4_unicode_ci;

DELIMITER //

CREATE OR REPLACE PROCEDURE check_user_ability_to_perform_quiz(p_user_id INT UNSIGNED, p_unit_id INT UNSIGNED)
BEGIN
  DECLARE v_has_access TINYINT(1) DEFAULT 0;
	DECLARE v_access_date DATETIME;
	DECLARE v_expiration_date DATETIME;
  
  CALL verify_session_user_role_assigned(p_user_id);
  IF @role = 'null' THEN CALL throw_error('undefined user'); END IF;
	IF @role != 'student' THEN CALL throw_error('invalid role'); END IF;
	
	SELECT 1, access_date, expiration_date INTO v_has_access, v_access_date, v_expiration_date FROM free_course_enrollments AS e
	JOIN course_delivery_sections AS s ON s.course_id = e.course_id
	JOIN course_delivery_subsections AS ss ON ss.section_id = s.id
	JOIN course_delivery_units AS u ON u.subsection_id = ss.id
	WHERE user_id = p_user_id AND u.id = p_unit_id;
	IF NOT v_has_access THEN CALL throw_error('not enrolled'); END IF;
	IF v_access_date > NOW() THEN CALL throw_error('access closed'); END IF;
	IF v_expiration_date < NOW() THEN CALL throw_error('access expired'); END IF;
END;

CREATE OR REPLACE PROCEDURE create_quiz_attempt(p_user_id INT UNSIGNED, p_unit_id INT UNSIGNED)
BEGIN
  DECLARE v_data_value_id INT UNSIGNED;
  
  CALL check_user_ability_to_perform_quiz(p_user_id, p_unit_id);
  
  SELECT data_value_id INTO v_data_value_id FROM course_delivery_units WHERE id = p_unit_id;
  SELECT increase_value_total_attachments(v_data_value_id);
  INSERT INTO quiz_attempts (user_id, unit_id, data_value_id, start_date) VALUES (p_user_id, p_unit_id, v_data_value_id, NOW());
END;

CREATE OR REPLACE PROCEDURE submit_quiz_reply(p_user_id INT UNSIGNED, p_unit_id INT UNSIGNED, p_reply LONGTEXT, p_score SMALLINT UNSIGNED, p_feedback LONGTEXT)
BEGIN
	CALL check_user_ability_to_perform_quiz(p_user_id, p_unit_id);
  UPDATE quiz_attempts SET last_submitted_reply = p_reply, score = p_score, feedback = p_feedback, last_submit_date = NOW(), replies_count = replies_count + 1 WHERE user_id = p_user_id AND unit_id = p_unit_id;
END;

CREATE OR REPLACE TRIGGER after_quiz_attempt_delete AFTER DELETE ON quiz_attempts FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.data_value_id);
END;

CREATE OR REPLACE FUNCTION create_file(p_mimetype TINYTEXT, p_buffer MEDIUMBLOB) RETURNS INT UNSIGNED
BEGIN
	INSERT INTO files SET mimetype = p_mimetype, _buffer = p_buffer;
	RETURN LAST_INSERT_ID();
END;

CREATE OR REPLACE PROCEDURE create_file_to_value_attachments(p_value_id INT UNSIGNED, p_file_id_array TEXT)
BEGIN
	DECLARE v_curr_comma_pos INT DEFAULT 0;
	DECLARE v_next_comma_pos INT DEFAULT LOCATE(',', p_file_id_array);
	DECLARE v_file_id INT;
	
	IF v_next_comma_pos = 0 THEN
		INSERT INTO file_to_value_attachments SET value_id = p_value_id, file_id = CONVERT(p_file_id_array, UNSIGNED) ON DUPLICATE KEY UPDATE value_id = value_id;
	ELSE
	
		WHILE v_next_comma_pos > 0 DO
	    SET v_file_id = CONVERT(SUBSTRING(p_file_id_array, v_curr_comma_pos + 1, v_next_comma_pos - v_curr_comma_pos - 1), UNSIGNED);
	    INSERT INTO file_to_value_attachments SET value_id = p_value_id, file_id = v_file_id ON DUPLICATE KEY UPDATE value_id = value_id;
	    SET v_curr_comma_pos = v_next_comma_pos;
	    SET v_next_comma_pos = LOCATE(',', p_file_id_array, v_curr_comma_pos + 1);
		END WHILE;
		
		SET v_file_id = CONVERT(SUBSTRING(p_file_id_array, v_curr_comma_pos + 1), UNSIGNED);
		INSERT INTO file_to_value_attachments SET value_id = p_value_id, file_id = v_file_id ON DUPLICATE KEY UPDATE value_id = value_id;
		
	END IF;
END;

CREATE OR REPLACE PROCEDURE update_file_to_value_attachments(p_value_id INT UNSIGNED, p_file_id_array TEXT)
BEGIN
	IF p_file_id_array = '' THEN
		DELETE FROM file_to_value_attachments WHERE value_id = p_value_id;
	ELSE
		DELETE FROM file_to_value_attachments WHERE value_id = p_value_id AND FIND_IN_SET(file_id, p_file_id_array) = 0;
		CALL create_file_to_value_attachments(p_value_id, p_file_id_array);
	END IF;
END;

CREATE OR REPLACE FUNCTION create_value(p_value LONGTEXT, p_file_id_array MEDIUMTEXT) RETURNS INT UNSIGNED
BEGIN
	DECLARE v_value_id INT UNSIGNED;
	
	IF p_value IS NULL THEN
		RETURN NULL;
	END IF;
	
	INSERT INTO _values SET _value = p_value;
	SET v_value_id = LAST_INSERT_ID();
	IF p_file_id_array IS NOT NULL AND p_file_id_array != '' THEN
		CALL create_file_to_value_attachments(v_value_id, p_file_id_array);
	END IF;
	
	RETURN v_value_id;
END;

CREATE OR REPLACE FUNCTION update_value(p_value_id INT UNSIGNED, p_value LONGTEXT, p_file_id_array TEXT) RETURNS INT UNSIGNED
BEGIN
  DECLARE v_total_attachments INT UNSIGNED DEFAULT IF(p_value_id IS NULL, 0, (SELECT total_attachments FROM _values WHERE id = p_value_id));
  DECLARE v_value_id INT UNSIGNED;
  
  IF p_value IS NULL THEN
  	IF v_total_attachments = 1 THEN
			DELETE FROM _values WHERE id = p_value_id;
		END IF;
  	RETURN NULL;
	END IF;

	IF v_total_attachments = 1 THEN
		UPDATE _values SET _value = p_value WHERE id = p_value_id;
		IF p_file_id_array IS NOT NULL THEN
			CALL update_file_to_value_attachments(p_value_id, p_file_id_array);
		END IF;
		RETURN p_value_id;
	ELSE
		INSERT INTO _values SET _value = p_value;
		SET v_value_id = LAST_INSERT_ID();
		CALL decrease_value_total_attachments(p_value_id);
		IF p_file_id_array IS NOT NULL AND p_file_id_array != '' THEN
			CALL create_file_to_value_attachments(v_value_id, p_file_id_array);
		END IF;
		RETURN v_value_id;
	END IF;
END;

CREATE OR REPLACE FUNCTION increase_value_total_attachments(p_value_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	IF p_value_id IS NULL THEN
		RETURN NULL;
	ELSE
		UPDATE _values SET total_attachments = total_attachments + 1 WHERE id = p_value_id;
		RETURN p_value_id;
	END IF;
END;

CREATE OR REPLACE PROCEDURE decrease_value_total_attachments(p_value_id INT UNSIGNED)
BEGIN
	IF p_value_id IS NOT NULL THEN
		IF (SELECT total_attachments FROM _values WHERE id = p_value_id) = 1 THEN
			DELETE FROM _values WHERE id = p_value_id;
		ELSE
			UPDATE _values SET total_attachments = total_attachments - 1 WHERE id = p_value_id;
		END IF;
	END IF;
END;

CREATE OR REPLACE TRIGGER before_value_delete BEFORE DELETE ON _values FOR EACH ROW
BEGIN
	DELETE FROM file_to_value_attachments WHERE value_id = OLD.id;
END;

CREATE OR REPLACE TRIGGER after_file_to_value_attachment_delete AFTER DELETE ON file_to_value_attachments FOR EACH ROW
BEGIN
	IF (SELECT COUNT(1) FROM file_to_value_attachments WHERE file_id = OLD.file_id) = 0 THEN
		DELETE FROM files WHERE id = OLD.file_id;
	END IF;
END;

CREATE OR REPLACE FUNCTION create_course_delivery_instance(p_template_id INT UNSIGNED, p_creator_id INT UNSIGNED, p_start_date DATETIME, p_enrollment_end_date DATETIME, p_price FLOAT) RETURNS INT UNSIGNED
BEGIN
	DECLARE v_insert_id INT UNSIGNED;
	
	IF (SELECT COUNT(1) FROM course_design_units WHERE subsection_id IN (
		SELECT id FROM course_design_subsections WHERE section_id IN (SELECT id FROM course_design_sections WHERE course_id = p_template_id)
	) AND data_value_id IS NULL) > 0 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot create course delivery instance, because one or more of it\'s units has data_value_id is set to NULL';
	END IF;
	
	INSERT INTO course_delivery_instances SELECT
		NULL,
		_name,
		increase_value_total_attachments(summary_value_id),
		increase_value_total_attachments(description_value_id),
		increase_value_total_attachments(picture_value_id),
		p_template_id,
		p_creator_id,
		NOW(),
		p_start_date,
		p_enrollment_end_date,
		p_price,
		0
	FROM course_design_templates WHERE id = p_template_id;
	SET v_insert_id = LAST_INSERT_ID();
	
	CALL create_course_delivery_sections(p_template_id, p_start_date, LAST_INSERT_ID());
	
	RETURN v_insert_id;
END;

CREATE OR REPLACE PROCEDURE create_course_delivery_sections(p_course_design_id INT, p_start_date DATETIME, p_course_delivery_id INT)
BEGIN
	DECLARE v_id INT;
	DECLARE v_name LONGTEXT;
  DECLARE v_summary_value_id LONGTEXT;
  DECLARE v_done INT DEFAULT FALSE;
	DECLARE v_cursor CURSOR FOR SELECT id, _name, summary_value_id FROM course_design_sections WHERE course_id = p_course_design_id;
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

	OPEN v_cursor;
	v_loop: LOOP
		FETCH v_cursor INTO v_id, v_name, v_summary_value_id;
		IF v_done THEN LEAVE v_loop; END IF;
		
		INSERT INTO course_delivery_sections VALUES (
			NULL,
			p_course_delivery_id,
			v_name,
			increase_value_total_attachments(v_summary_value_id)
		);
		
		CALL create_course_delivery_subsections(v_id, p_start_date, LAST_INSERT_ID());
	END LOOP;
	CLOSE v_cursor;
END;

CREATE OR REPLACE PROCEDURE create_course_delivery_subsections(p_design_section_id INT, p_start_date DATETIME, p_delivery_section_id INT)
BEGIN
  DECLARE v_id INT;
	DECLARE v_name VARCHAR(100);
  DECLARE v_summary_value_id LONGTEXT;
	DECLARE v_access_period INT UNSIGNED;
  DECLARE v_expiration_period INT UNSIGNED;
  DECLARE v_done INT DEFAULT FALSE;
	DECLARE v_cursor CURSOR FOR SELECT id, _name, summary_value_id, access_period, expiration_period FROM course_design_subsections WHERE section_id = p_design_section_id;
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

	OPEN v_cursor;
	v_loop: LOOP
		FETCH v_cursor INTO v_id, v_name, v_summary_value_id, v_access_period, v_expiration_period;
		IF v_done THEN LEAVE v_loop; END IF;
		
		INSERT INTO course_delivery_subsections VALUES (
			NULL,
			p_delivery_section_id,
			v_name,
			increase_value_total_attachments(v_summary_value_id),
			IF(v_access_period IS NULL, NULL, DATE_ADD(p_start_date, INTERVAL v_access_period DAY)),
			IF(v_expiration_period IS NULL, NULL, DATE_ADD(p_start_date, INTERVAL v_expiration_period DAY))
		);
		
		INSERT INTO course_delivery_units SELECT 
			NULL,
			LAST_INSERT_ID(),
			_name,
			increase_value_total_attachments(summary_value_id),
			_type,
			increase_value_total_attachments(data_value_id),
			index_number
		FROM course_design_units WHERE subsection_id = v_id;
	END LOOP;
	CLOSE v_cursor;
END;

CREATE OR REPLACE TRIGGER after_user_delete AFTER DELETE ON users FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.picture_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_design_template_delete BEFORE DELETE ON course_design_templates FOR EACH ROW
BEGIN
	DELETE FROM course_design_sections WHERE course_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_design_template_delete AFTER DELETE ON course_design_templates FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
	CALL decrease_value_total_attachments(OLD.description_value_id);
	CALL decrease_value_total_attachments(OLD.picture_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_delivery_instance_delete BEFORE DELETE ON course_delivery_instances FOR EACH ROW
BEGIN
	DELETE FROM course_delivery_sections WHERE course_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_delivery_instance_delete AFTER DELETE ON course_delivery_instances FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
	CALL decrease_value_total_attachments(OLD.description_value_id);
	CALL decrease_value_total_attachments(OLD.picture_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_design_section_delete BEFORE DELETE ON course_design_sections FOR EACH ROW
BEGIN
	DELETE FROM course_design_subsections WHERE section_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_design_section_delete AFTER DELETE ON course_design_sections FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_delivery_section_delete BEFORE DELETE ON course_delivery_sections FOR EACH ROW
BEGIN
	DELETE FROM course_delivery_subsections WHERE section_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_delivery_section_delete AFTER DELETE ON course_delivery_sections FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_design_subsection_delete BEFORE DELETE ON course_design_subsections FOR EACH ROW
BEGIN
	DELETE FROM course_design_units WHERE subsection_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_design_subsection_delete AFTER DELETE ON course_design_subsections FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_delivery_subsection_delete BEFORE DELETE ON course_delivery_subsections FOR EACH ROW
BEGIN
	DELETE FROM course_delivery_units WHERE subsection_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_delivery_subsection_delete AFTER DELETE ON course_delivery_subsections FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER after_course_design_unit_delete AFTER DELETE ON course_design_units FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
	CALL decrease_value_total_attachments(OLD.data_value_id);
END;

CREATE OR REPLACE TRIGGER after_course_delivery_unit_delete AFTER DELETE ON course_delivery_units FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
	CALL decrease_value_total_attachments(OLD.data_value_id);
END;

//
DELIMITER ;