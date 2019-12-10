USE openedu;
SET collation_connection = utf8mb4_unicode_ci;

DELIMITER //

-- bug#1: trigger does not fire when an action is called from another trigger

CREATE OR REPLACE PROCEDURE _throw_error(p_message_text TINYTEXT)
BEGIN
	SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = p_message_text;
END;

--
-- user routine
--

CREATE OR REPLACE FUNCTION get_user_role(p_user_id INT UNSIGNED) RETURNS TINYTEXT
BEGIN
	RETURN (SELECT role FROM users WHERE id = p_user_id);
END;

-- CREATE OR REPLACE FUNCTION get_session_user_role() RETURNS TINYTEXT
-- BEGIN
-- RETURN @role;
-- END;

CREATE OR REPLACE PROCEDURE _verify_session_user_role_assigned(p_user_id INT UNSIGNED)
BEGIN
	IF @role IS NULL THEN
		SET @role = get_user_role(p_user_id);
		IF @role IS NULL THEN SET @role = 'null'; END IF;
	END IF;
END;

CREATE OR REPLACE TRIGGER after_user_delete AFTER DELETE ON users FOR EACH ROW
BEGIN
	CALL _decrease_value_total_attachments(OLD.picture_value_id);
END;

--
-- file routine
--

CREATE OR REPLACE FUNCTION create_file(p_mimetype TINYTEXT, p_buffer MEDIUMBLOB) RETURNS INT UNSIGNED
BEGIN
	INSERT INTO files SET mimetype = p_mimetype, _buffer = p_buffer;
	RETURN LAST_INSERT_ID();
END;

-- private
-- p_is_new_value indicates whether the value reference with the specified identifier is newly created (optimization)
CREATE OR REPLACE PROCEDURE _set_file_to_value_attachments(p_value_id INT UNSIGNED, p_file_id_array TEXT, p_is_new_value BOOLEAN)
BEGIN
	DECLARE v_file_id INT UNSIGNED;

	IF NOT p_is_new_value THEN
		-- deletes existing attachments that are not in the specified array of file identifiers
		DELETE FROM file_to_value_attachments WHERE value_id = p_value_id AND NOT JSON_CONTAINS(p_file_id_array, file_id);
	END IF;
	
	-- iterates over the indexes of the specified array of file identifiers
	FOR _index IN 0 .. JSON_LENGTH(p_file_id_array) - 1 DO
		-- extracts the value with the current index as the current file identifier
		SET v_file_id = JSON_VALUE(p_file_id_array, CONCAT('$[', _index, ']'));
		-- inserts a new attachment if the attachment with the specified value reference identifier and the current file identifier does not exists
		IF NOT EXISTS (SELECT 1 FROM file_to_value_attachments WHERE value_id = p_value_id AND file_id = v_file_id) THEN
			INSERT INTO file_to_value_attachments SET value_id = p_value_id, file_id = v_file_id;
		END IF;
	END FOR;
END;

CREATE OR REPLACE TRIGGER after_file_to_value_attachment_delete AFTER DELETE ON file_to_value_attachments FOR EACH ROW
BEGIN
	-- if there are no attachments to the current file, then deletes it
	IF NOT EXISTS (SELECT 1 FROM file_to_value_attachments WHERE file_id = OLD.file_id) THEN
		DELETE FROM files WHERE id = OLD.file_id;
	END IF;
END;

--
-- value routine
--

CREATE OR REPLACE FUNCTION get_value(p_value_id INT UNSIGNED) RETURNS LONGTEXT
BEGIN
	RETURN (SELECT _value FROM _values WHERE id = p_value_id);
END;

CREATE OR REPLACE FUNCTION set_value(p_value_id INT UNSIGNED, p_value LONGTEXT, p_file_id_array TEXT) RETURNS INT UNSIGNED
BEGIN
	-- if the identifier of the value reference is not specified, then it has no attachments 
  DECLARE v_total_attachments INT UNSIGNED DEFAULT IF(p_value_id IS NULL, 0, (SELECT total_attachments FROM _values WHERE id = p_value_id));
  DECLARE v_new_value_id INT UNSIGNED;
  
	-- if the specified value reference has only one attachment
	IF v_total_attachments = 1 THEN
		-- if value is not specified, then deletes the specified value reference
		IF p_value IS NULL THEN
			DELETE FROM _values WHERE id = p_value_id;
			RETURN NULL;
		END IF;
		-- updates the specified value reference
		UPDATE _values SET _value = p_value WHERE id = p_value_id;
		-- if array of file identifiers is specified, then updates file attachments of the specified value reference
		IF p_file_id_array IS NOT NULL THEN CALL _set_file_to_value_attachments(p_value_id, p_file_id_array, 0); END IF;
		-- returns old identifier
		RETURN p_value_id;
	ELSE
		-- if the scpecified value reference has more than one attachment, decreases its total_attachments by one
		IF v_total_attachments != 0 THEN
			UPDATE _values SET total_attachments = total_attachments - 1 WHERE id = p_value_id;
		END IF;
		-- inserts new value 
		INSERT INTO _values SET _value = p_value;
		SET v_new_value_id = LAST_INSERT_ID();
		-- if array of file identifiers is specified, then creates file attachments of the newly created value reference
		IF p_file_id_array IS NOT NULL THEN CALL _set_file_to_value_attachments(v_new_value_id, p_file_id_array, 1); END IF;
		-- returns identifier of the newly created value reference
		RETURN v_new_value_id;
	END IF;
END;

-- private
CREATE OR REPLACE FUNCTION _increase_value_total_attachments(p_value_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	-- does nothing if the value reference identifier is not specified
	IF p_value_id IS NULL THEN
		RETURN NULL;
	-- otherwise increases total_attachments of the specified value reference by one
	ELSE
		UPDATE _values SET total_attachments = total_attachments + 1 WHERE id = p_value_id;
		RETURN p_value_id;
	END IF;
END;

-- private
CREATE OR REPLACE PROCEDURE _decrease_value_total_attachments(p_value_id INT UNSIGNED)
BEGIN
	-- acts only if the identifier of the value reference is specified
	IF p_value_id IS NOT NULL THEN
		-- if the specified value reference has only one attachment, then deletes it
		IF (SELECT total_attachments FROM _values WHERE id = p_value_id) = 1 THEN
			DELETE FROM _values WHERE id = p_value_id;
		-- otherwise decreases total_attachments of the specified value reference by one
		ELSE
			UPDATE _values SET total_attachments = total_attachments - 1 WHERE id = p_value_id;
		END IF;
	END IF;
END;

-- exists because of the bug#1
CREATE OR REPLACE TRIGGER before_value_delete BEFORE DELETE ON _values FOR EACH ROW
BEGIN
	-- deletes all file attachments for the current value reference
	DELETE FROM file_to_value_attachments WHERE value_id = OLD.id;
END;

--
-- course design routine
--

CREATE OR REPLACE TRIGGER before_course_design_template_delete BEFORE DELETE ON course_design_templates FOR EACH ROW
BEGIN
	DELETE FROM course_design_sections WHERE course_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_design_template_delete AFTER DELETE ON course_design_templates FOR EACH ROW
BEGIN
	CALL _decrease_value_total_attachments(OLD.summary_value_id);
	CALL _decrease_value_total_attachments(OLD.description_value_id);
	CALL _decrease_value_total_attachments(OLD.picture_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_design_section_delete BEFORE DELETE ON course_design_sections FOR EACH ROW
BEGIN
	DELETE FROM course_design_subsections WHERE section_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_design_section_delete AFTER DELETE ON course_design_sections FOR EACH ROW
BEGIN
	CALL _decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_design_subsection_delete BEFORE DELETE ON course_design_subsections FOR EACH ROW
BEGIN
	DELETE FROM course_design_units WHERE subsection_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_design_subsection_delete AFTER DELETE ON course_design_subsections FOR EACH ROW
BEGIN
	CALL _decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER after_course_design_unit_delete AFTER DELETE ON course_design_units FOR EACH ROW
BEGIN
	CALL _decrease_value_total_attachments(OLD.summary_value_id);
	CALL _decrease_value_total_attachments(OLD.data_value_id);
END;

--
-- course delivery routine
--

CREATE OR REPLACE FUNCTION create_course_delivery_instance(p_template_id INT UNSIGNED, p_creator_id INT UNSIGNED, p_start_date DATETIME, p_enrollment_end_date DATETIME, p_price DECIMAL(11, 2)) RETURNS INT UNSIGNED
BEGIN
	DECLARE v_course_insert_id INT UNSIGNED;
	DECLARE v_section_insert_id INT UNSIGNED;
	
	IF (SELECT COUNT(1) FROM course_design_units WHERE subsection_id IN (
		SELECT id FROM course_design_subsections WHERE section_id IN (SELECT id FROM course_design_sections WHERE course_id = p_template_id)
	) AND data_value_id IS NULL) > 0 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot create course delivery instance, because one or more of its units has data_value_id is set to NULL';
	END IF;
	
	INSERT INTO course_delivery_instances (_name, summary_value_id, description_value_id, picture_value_id, creator_id, _data, template_id, creation_date, start_date, enrollment_end_date, price) SELECT
		_name,
		_increase_value_total_attachments(summary_value_id),
		_increase_value_total_attachments(description_value_id),
		_increase_value_total_attachments(picture_value_id),
		p_creator_id,
		_data,		
		p_template_id,
		NOW(),
		p_start_date,
		p_enrollment_end_date,
		p_price
		
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
			
			INSERT INTO course_delivery_subsections (section_id, _name, summary_value_id, access_period, expiration_period, sequence_number) VALUES (
				v_section_insert_id,
				_current_subsection._name,
				_increase_value_total_attachments(_current_subsection.summary_value_id),
				IF(_current_subsection.access_period IS NULL, NULL, DATE_ADD(p_start_date, INTERVAL _current_subsection.access_period DAY)),
				IF(_current_subsection.expiration_period IS NULL, NULL, DATE_ADD(p_start_date, INTERVAL _current_subsection.expiration_period DAY)),
				_current_subsection.sequence_number
			);
			
			INSERT INTO course_delivery_units (subsection_id, _name, summary_value_id, _type, data_value_id, sequence_number) SELECT 
				LAST_INSERT_ID(),
				_name,
				_increase_value_total_attachments(summary_value_id),
				_type,
				_increase_value_total_attachments(data_value_id),
				sequence_number
			FROM course_design_units WHERE subsection_id = v_id;
			
		END FOR;
		
	END FOR;
	
	RETURN v_course_insert_id;
END;

CREATE OR REPLACE TRIGGER before_course_delivery_instance_delete BEFORE DELETE ON course_delivery_instances FOR EACH ROW
BEGIN
	DELETE FROM course_delivery_sections WHERE course_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_delivery_instance_delete AFTER DELETE ON course_delivery_instances FOR EACH ROW
BEGIN
	CALL _decrease_value_total_attachments(OLD.summary_value_id);
	CALL _decrease_value_total_attachments(OLD.description_value_id);
	CALL _decrease_value_total_attachments(OLD.picture_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_delivery_section_delete BEFORE DELETE ON course_delivery_sections FOR EACH ROW
BEGIN
	DELETE FROM course_delivery_subsections WHERE section_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_delivery_section_delete AFTER DELETE ON course_delivery_sections FOR EACH ROW
BEGIN
	CALL _decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_delivery_subsection_delete BEFORE DELETE ON course_delivery_subsections FOR EACH ROW
BEGIN
	DELETE FROM course_delivery_units WHERE subsection_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_delivery_subsection_delete AFTER DELETE ON course_delivery_subsections FOR EACH ROW
BEGIN
	CALL _decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER after_course_delivery_unit_delete AFTER DELETE ON course_delivery_units FOR EACH ROW
BEGIN
	CALL _decrease_value_total_attachments(OLD.summary_value_id);
	CALL _decrease_value_total_attachments(OLD.data_value_id);
END;

--
-- sequence routine
--

CREATE OR REPLACE PROCEDURE move_entry_over(p_entity_type ENUM(
	'course_design_section',
	'course_design_subsection',
	'course_design_unit',
	'course_delivery_section',
	'course_delivery_subsection',
	'course_delivery_unit'
), p_moving_entry_id INT UNSIGNED, p_put_before_entry_id INT UNSIGNED)
BEGIN
	DECLARE v_parent_entry_id INT UNSIGNED;
	DECLARE v_entry_id_array TEXT;
	DECLARE v_current_entry_id INT UNSIGNED;
	DECLARE v_current_sequence_number INT UNSIGNED DEFAULT 0;
	DECLARE v_new_sequence_numbers TEXT DEFAULT '{}';
	
	-- finds the parent entry identifier, then, using it, finds all entries with the identifier found and extracts them into the array in order of sequence number
	-- 'ORDER BY -index_number DESC' is used insted of 'ORDER BY index_number' to put entries with a sequence number of 'NULL' at the end
	CASE p_entity_type
		WHEN 'course_design_section' THEN
			SET v_parent_entry_id = (SELECT course_id FROM course_design_sections WHERE id = p_moving_entry_id);
			SET v_entry_id_array = (SELECT GROUP_CONCAT(id SEPARATOR ',') FROM course_design_sections WHERE course_id = v_parent_entry_id ORDER BY -sequence_number DESC);
		WHEN 'course_design_subsection' THEN
			SET v_parent_entry_id = (SELECT section_id FROM course_design_subsections WHERE id = p_moving_entry_id);
			SET v_entry_id_array = (SELECT GROUP_CONCAT(id SEPARATOR ',') FROM course_design_subsections WHERE section_id = v_parent_entry_id ORDER BY -sequence_number DESC);
    	WHEN 'course_design_unit' THEN
    		SET v_parent_entry_id = (SELECT subsection_id FROM course_design_units WHERE id = p_moving_entry_id);
			SET v_entry_id_array = (SELECT GROUP_CONCAT(id SEPARATOR ',') FROM course_design_units WHERE subsection_id = v_parent_entry_id ORDER BY -sequence_number DESC);
    	WHEN 'course_delivery_section' THEN
    		SET v_parent_entry_id = (SELECT course_id FROM course_delivery_sections WHERE id = p_moving_entry_id);
			SET v_entry_id_array = (SELECT GROUP_CONCAT(id SEPARATOR ',') FROM course_delivery_sections WHERE course_id = v_parent_entry_id ORDER BY -sequence_number DESC);
		WHEN 'course_delivery_subsection' THEN
			SET v_parent_entry_id = (SELECT section_id FROM course_delivery_subsections WHERE id = p_moving_entry_id);
			SET v_entry_id_array = (SELECT GROUP_CONCAT(id SEPARATOR ',') FROM course_delivery_subsections WHERE section_id = v_parent_entry_id ORDER BY -sequence_number DESC);
    	WHEN 'course_delivery_unit' THEN
    		SET v_parent_entry_id = (SELECT subsection_id FROM course_delivery_units WHERE id = p_moving_entry_id);
			SET v_entry_id_array = (SELECT GROUP_CONCAT(id SEPARATOR ',') FROM course_delivery_units WHERE subsection_id = v_parent_entry_id ORDER BY -sequence_number DESC);
  	END CASE;
	SET v_entry_id_array = CONCAT('[', v_entry_id_array, ']');
	
	-- creates an object that contains properties named as the entry identifier equal to its corresponding new sequence number
	-- iterates over all entry identifiers
	FOR _index IN 0 .. JSON_LENGTH(v_entry_id_array) - 1 DO
		-- extracts the current entry identifier
		SET v_current_entry_id = JSON_VALUE(v_entry_id_array, CONCAT('$[', _index, ']'));
		-- if the current identifier is equal to the one before which to put, then set the sequence number of the moving entry to the current sequence number
		IF v_current_entry_id = p_put_before_entry_id THEN
			SET v_new_sequence_numbers = JSON_INSERT(v_sequence_numbers, CONCAT('$.', p_moving_entry_id), v_current_sequence_number);
			SET v_current_sequence_number = v_current_sequence_number + 1;
		END IF;
		-- if the current identifier is not equal to the moving one, then set the sequence number of the current entry to the current sequence number
		IF v_current_entry_id != p_moving_entry_id THEN
			SET v_new_sequence_numbers = JSON_INSERT(v_sequence_numbers, CONCAT('$.', v_current_entry_id), v_current_sequence_number);
			SET v_current_sequence_number = v_current_sequence_number + 1;
		END IF;
	END FOR;
	-- if the identifier before which to put is not specified, then set the sequence number of the moving entry to the last
	IF p_put_before_entry_id IS NULL THEN
		SET v_new_sequence_numbers = JSON_INSERT(v_sequence_numbers, CONCAT('$.', p_moving_entry_id), v_current_sequence_number);
	END IF;
	
	-- updates sequence numbers of entries with the same parent entry identifier according to the previously created object
	CASE p_entity_type
		WHEN 'course_design_section' THEN
			UPDATE course_design_sections SET sequence_number = JSON_VALUE(v_new_sequence_numbers, CONCAT('$.', id)) WHERE course_id = v_parent_entry_id;
		WHEN 'course_design_subsection' THEN
			UPDATE course_design_subsections SET sequence_number = JSON_VALUE(v_new_sequence_numbers, CONCAT('$.', id)) WHERE section_id = v_parent_entry_id;
    	WHEN 'course_design_unit' THEN
    		UPDATE course_design_units SET sequence_number = JSON_VALUE(v_new_sequence_numbers, CONCAT('$.', id)) WHERE subsection_id = v_parent_entry_id;
    	WHEN 'course_delivery_section' THEN
    		UPDATE course_delivery_sections SET sequence_number = JSON_VALUE(v_new_sequence_numbers, CONCAT('$.', id)) WHERE course_id = v_parent_entry_id;
		WHEN 'course_delivery_subsection' THEN
			UPDATE course_delivery_subsections SET sequence_number = JSON_VALUE(v_new_sequence_numbers, CONCAT('$.', id)) WHERE section_id = v_parent_entry_id;
    	WHEN 'course_delivery_unit' THEN
    		UPDATE course_delivery_units SET sequence_number = JSON_VALUE(v_new_sequence_numbers, CONCAT('$.', id)) WHERE subsection_id = v_parent_entry_id;
	END CASE;
END;

CREATE OR REPLACE FUNCTION _is_follow_before(p_current_sequence_number INT UNSIGNED, p_sequence_number INT UNSIGNED, p_current_id INT UNSIGNED, p_id INT UNSIGNED) RETURNS BOOLEAN
BEGIN
	IF p_sequence_number IS NULL THEN
		IF p_current_sequence_number IS NULL THEN
			RETURN p_current_id < p_id;
		END IF;
		RETURN TRUE;
	END IF;
	RETURN p_current_sequence_number < p_sequence_number;
END;

CREATE OR REPLACE FUNCTION get_previous_subsection_delivery_id(p_subsection_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	DECLARE v_section_id INT UNSIGNED;
	DECLARE v_sequence_number INT UNSIGNED;
	DECLARE v_course_id INT UNSIGNED;
	DECLARE v_section_sequence_number INT UNSIGNED;
	DECLARE v_previous_section_id INT UNSIGNED;
	
	SELECT section_id, sequence_number INTO v_section_id, v_sequence_number FROM course_delivery_subsections WHERE id = p_subsection_id;
	-- if the subsection with the specified identifier is the first of the section in order of sequence number, then finds the previous section identifier
	IF (SELECT id FROM course_delivery_subsections WHERE section_id = v_section_id ORDER BY -sequence_number DESC LIMIT 1) = p_subsection_id THEN
	
		SELECT course_id, sequence_number INTO v_course_id, v_section_sequence_number FROM course_delivery_sections WHERE id = v_section_id;
		SET v_previous_section_id = (
			SELECT id, sequence_number FROM course_delivery_sections WHERE course_id = v_course_id
			AND _is_follow_before(sequence_number, v_section_sequence_number, id, v_section_id)
			ORDER BY -sequence_number, id DESC LIMIT 1
		);
		-- if the previous section identifier is not found, then returns 'NULL'
		IF v_previous_section_id IS NULL THEN
			RETURN NULL;
		END IF;
		-- otherwise returns the last subsection identifier of the previous section
		RETURN (SELECT id FROM course_delivery_subsections WHERE section_id = v_previous_section_id ORDER BY -sequence_number, id DESC LIMIT 1);
	END IF;
	-- if the specified subsection is not the first, then returns the previous subsection identifier of the section
	RETURN (SELECT id FROM course_delivery_subsections WHERE section_id = v_section_id AND _is_follow_before(sequence_number, v_sequence_number, id, p_subsection_id) ORDER BY -sequence_number, id DESC LIMIT 1);
END;

CREATE OR REPLACE FUNCTION _is_follow_after(p_current_sequence_number INT UNSIGNED, p_sequence_number INT UNSIGNED, p_current_id INT UNSIGNED, p_id INT UNSIGNED) RETURNS BOOLEAN
BEGIN
	IF p_current_sequence_number IS NULL THEN
		IF p_sequence_number IS NULL THEN
			RETURN p_current_id > p_id;
		END IF;
		RETURN TRUE;
	END IF;
	RETURN p_current_sequence_number > p_sequence_number;
END;

CREATE OR REPLACE FUNCTION get_next_subsection_delivery_id(p_subsection_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	DECLARE v_section_id INT UNSIGNED;
	DECLARE v_sequence_number INT UNSIGNED;
	DECLARE v_course_id INT UNSIGNED;
	DECLARE v_section_sequence_number INT UNSIGNED;
	DECLARE v_next_section_id INT UNSIGNED;
	
	SELECT section_id, sequence_number INTO v_section_id, v_sequence_number FROM course_delivery_subsections WHERE id = p_subsection_id;
	-- if the subsection with the specified identifier is the last of the section in order of sequence number, then finds the next section identifier
	IF (SELECT id FROM course_delivery_subsections WHERE section_id = v_section_id ORDER BY -sequence_number LIMIT 1) = p_subsection_id THEN
		
		SELECT course_id, sequence_number INTO v_course_id, v_section_sequence_number FROM course_delivery_sections WHERE id = v_section_id;
		SET v_next_section_id = (
			SELECT id, sequence_number FROM course_delivery_sections WHERE course_id = v_course_id
			AND _is_follow_after(sequence_number, v_section_sequence_number, id, v_section_id)
			ORDER BY -sequence_number DESC LIMIT 1
		);
		-- if the next section identifier is not found, then returns 'NULL'
		IF v_next_section_id IS NULL THEN
			RETURN NULL;
		END IF;
		-- otherwise returns the first subsection identifier of the next section
		RETURN (SELECT id FROM course_delivery_subsections WHERE section_id = v_previous_section_id ORDER BY -sequence_number DESC LIMIT 1);
	END IF;
	-- if the specified subsection is not the last, then returns the next subsection identifier of the section
	RETURN (SELECT id FROM course_delivery_subsections WHERE section_id = v_section_id AND _is_follow_after(sequence_number, v_sequence_number, id, p_subsection_id) ORDER BY -sequence_number DESC LIMIT 1);
END;

--
-- access routine
--

CREATE OR REPLACE FUNCTION is_enrolled_to_course(p_user_id INT UNSIGNED, p_course_id INT UNSIGNED) RETURNS BOOLEAN
BEGIN
	RETURN (
		(SELECT 1 FROM free_course_enrollments WHERE user_id = p_user_id AND course_id = p_course_id)
		UNION ALL
		(SELECT 1 FROM paid_course_purchases WHERE user_id = p_user_id AND course_id = p_course_id AND callback_status = 'success')
		LIMIT 1
	);
END;

CREATE OR REPLACE PROCEDURE enroll_user_into_free_course(p_user_id INT UNSIGNED, p_course_id INT UNSIGNED)
BEGIN
	DECLARE v_now_date DATETIME DEFAULT NOW();
	DECLARE v_price DATETIME;
	DECLARE v_start_date DATETIME;
	DECLARE v_enrollment_end_date DATETIME;
	
	SELECT price, start_date, enrollment_end_date INTO v_price, v_start_date, v_enrollment_end_date
	FROM course_delivery_instances WHERE id = p_course_id;
	
	IF v_price > 0 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PAID_COURSE';
	END IF;
	IF v_enrollment_end_date < v_now_date THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ENROLLMENT_EXPIRED';
	END IF;
	
	INSERT INTO free_course_enrollments (user_id, course_id, enrollment_date) VALUES (p_user_id, p_course_id, v_now_date);
END;

CREATE OR REPLACE FUNCTION get_entry_course_id(p_entity_type ENUM(
	'course_delivery_subsection',
	'course_delivery_unit'
), p_instance_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN

	IF p_entity_type = 'course_delivery_subsection' THEN
		RETURN (
			SELECT course_id FROM course_delivery_sections WHERE id = (
				SELECT section_id FROM course_delivery_subsections WHERE id = p_instance_id
			)
		);
	END IF;
	
	IF p_entity_type = 'course_delivery_subsection' THEN
		RETURN (
			SELECT course_id FROM course_delivery_sections WHERE id = (
				SELECT section_id FROM course_delivery_subsections WHERE id = (
					SELECT subsection_id FROM course_delivery_units WHERE id = p_instance_id
				)
			)
		);
	END IF;
END;

CREATE OR REPLACE FUNCTION check_user_access_to_entry(p_user_id INT UNSIGNED, p_entity_type ENUM(
	'course_delivery_subsection',
	'course_delivery_unit'
), p_instance_id INT UNSIGNED) RETURNS TINYTEXT
BEGIN
	DECLARE v_has_access BOOLEAN DEFAULT 0;
	DECLARE v_course_id INT UNSIGNED;
	DECLARE v_access_date DATETIME;
	
	CALL verify_session_user_role_assigned(p_user_id);
	IF @role = 'null' THEN RETURN 'undefined user'; END IF;
	
	IF @role = 'superuser' THEN RETURN 'ok'; END IF;
	IF @role = 'admin' THEN RETURN 'ok'; END IF;
	
	SET v_course_id = get_entry_course_id(p_entity_type, p_instance_id);
	
	IF @role = 'instructor' THEN
	
		SET v_has_access = (SELECT 1 FROM instructor_assignments WHERE user_id = p_user_id AND course_id = v_course_id);
		IF NOT v_has_access THEN RETURN 'not assigned'; END IF;
		
	END IF;
	
	IF @role = 'student' THEN
	
		SET v_has_access = is_enrolled_to_course(p_user_id, v_course_id);
		IF NOT v_has_access THEN RETURN 'not enrolled'; END IF;
		
		IF p_entity_type = 'course_delivery_subsection' THEN
			SET v_access_date = (SELECT access_date FROM course_delivery_subsections WHERE id = p_instance_id);
		END IF;
		
		IF p_entity_type = 'course_delivery_unit' THEN
			SET v_access_date = (SELECT access_date FROM course_delivery_subsections WHERE id = (SELECT subsection_id FROM course_delivery_units WHERE id = p_instance_id));
		END IF;
		
		IF v_access_date > NOW() THEN RETURN 'access closed'; END IF;
		RETURN 'ok';
		
	END IF;
	
	RETURN 'undefined entry';
END;

--
-- quiz routine
--

CREATE OR REPLACE PROCEDURE _check_user_ability_to_perform_quiz(p_user_id INT UNSIGNED, p_unit_id INT UNSIGNED)
BEGIN
  DECLARE v_has_access TINYINT(1) DEFAULT 0;
	DECLARE v_access_date DATETIME;
	DECLARE v_expiration_date DATETIME;
	DECLARE v_course_id INT UNSIGNED;
	DECLARE v_subsection_id INT UNSIGNED;
  
	CALL verify_session_user_role_assigned(p_user_id);
	IF @role = 'null' THEN CALL _throw_error('undefined user'); END IF;
	IF @role != 'student' THEN CALL _throw_error('invalid role'); END IF;
	
	SELECT c.id, access_date, expiration_date INTO v_course_id, v_access_date, v_expiration_date FROM course_delivery_instances AS c
	JOIN course_delivery_sections AS s ON s.course_id = c.id
	JOIN course_delivery_subsections AS ss ON ss.section_id = s.id
	JOIN course_delivery_units AS u ON u.subsection_id = ss.id
	WHERE u.id = p_unit_id;
	
	IF v_access_date > NOW() THEN CALL _throw_error('access closed'); END IF;
	IF v_expiration_date < NOW() THEN CALL _throw_error('access expired'); END IF;	
	
	SET v_has_access = is_enrolled_to_course(p_user_id, v_course_id);
	IF NOT v_has_access THEN CALL _throw_error('not enrolled'); END IF;
END;

CREATE OR REPLACE PROCEDURE create_quiz_attempt(p_user_id INT UNSIGNED, p_unit_id INT UNSIGNED)
BEGIN
  DECLARE v_data_value_id INT UNSIGNED;
  
  CALL _check_user_ability_to_perform_quiz(p_user_id, p_unit_id);
  
  SET v_data_value_id = (SELECT data_value_id FROM course_delivery_units WHERE id = p_unit_id);
  SELECT _increase_value_total_attachments(v_data_value_id);
  INSERT INTO quiz_attempts (user_id, unit_id, data_value_id, start_date) VALUES (p_user_id, p_unit_id, v_data_value_id, NOW());
END;

CREATE OR REPLACE PROCEDURE submit_quiz_reply(p_user_id INT UNSIGNED, p_unit_id INT UNSIGNED, p_reply LONGTEXT, p_score SMALLINT UNSIGNED, p_feedback LONGTEXT)
BEGIN
	CALL _check_user_ability_to_perform_quiz(p_user_id, p_unit_id);
  UPDATE quiz_attempts SET last_submitted_reply = p_reply, score = p_score, feedback = p_feedback, last_submit_date = NOW(), replies_count = replies_count + 1 WHERE user_id = p_user_id AND unit_id = p_unit_id;
END;

CREATE OR REPLACE TRIGGER after_quiz_attempt_delete AFTER DELETE ON quiz_attempts FOR EACH ROW
BEGIN
	CALL _decrease_value_total_attachments(OLD.data_value_id);
END;

-- CREATE OR REPLACE FUNCTION get_course_design_template_creator_id(p_course_id INT UNSIGNED) RETURNS INT UNSIGNED
-- BEGIN
-- RETURN (
-- SELECT creator_id FROM course_design_templates WHERE id = p_course_id
-- );
-- END;
-- 
-- CREATE OR REPLACE FUNCTION get_course_design_section_creator_id(p_section_id INT UNSIGNED) RETURNS INT UNSIGNED
-- BEGIN
-- RETURN (
-- SELECT creator_id FROM course_design_templates WHERE id = (
-- SELECT course_id FROM course_design_sections WHERE id = p_section_id
-- )
-- );
-- END;
-- 
-- CREATE OR REPLACE FUNCTION get_course_design_subsection_creator_id(p_subsection_id INT UNSIGNED) RETURNS INT UNSIGNED
-- BEGIN
-- RETURN (
-- SELECT creator_id FROM course_design_templates WHERE id = (
-- SELECT course_id FROM course_design_sections WHERE id = (
-- SELECT section_id FROM course_design_subsections WHERE id = p_subsection_id
-- )
-- )
-- );
-- END;
-- 
-- CREATE OR REPLACE FUNCTION get_course_design_unit_creator_id(p_unit_id INT UNSIGNED) RETURNS INT UNSIGNED
-- BEGIN
-- RETURN (
-- SELECT creator_id FROM course_design_templates WHERE id = (
-- SELECT course_id FROM course_design_sections WHERE id = (
-- SELECT section_id FROM course_design_subsections WHERE id = (
-- SELECT subsection_id FROM course_design_units WHERE id = p_unit_id
-- )
-- )
-- )
-- );
-- END;
-- 
-- CREATE OR REPLACE FUNCTION get_course_delivery_instance_creator_id(p_course_id INT UNSIGNED) RETURNS INT UNSIGNED
-- BEGIN
-- RETURN (
-- SELECT creator_id FROM course_delivery_instances WHERE id = p_course_id
-- );
-- END;
-- 
-- CREATE OR REPLACE FUNCTION get_course_delivery_section_creator_id(p_section_id INT UNSIGNED) RETURNS INT UNSIGNED
-- BEGIN
-- RETURN (
-- SELECT creator_id FROM course_delivery_instances WHERE id = (
-- SELECT course_id FROM course_delivery_sections WHERE id = p_section_id
-- )
-- );
-- END;
-- 
-- CREATE OR REPLACE FUNCTION get_course_delivery_subsection_creator_id(p_subsection_id INT UNSIGNED) RETURNS INT UNSIGNED
-- BEGIN
-- RETURN (
-- SELECT creator_id FROM course_delivery_instances WHERE id = (
-- SELECT course_id FROM course_delivery_sections WHERE id = (
-- SELECT section_id FROM course_delivery_subsections WHERE id = p_subsection_id
-- )
-- )
-- );
-- END;
-- 
-- CREATE OR REPLACE FUNCTION get_course_delivery_unit_creator_id(p_unit_id INT UNSIGNED) RETURNS INT UNSIGNED
-- BEGIN
-- RETURN (
-- SELECT creator_id FROM course_delivery_instances WHERE id = (
-- SELECT course_id FROM course_delivery_sections WHERE id = (
-- SELECT section_id FROM course_delivery_subsections WHERE id = (
-- SELECT subsection_id FROM course_delivery_units WHERE id = p_unit_id
-- )
-- )
-- )
-- );
-- END;

//
DELIMITER ;