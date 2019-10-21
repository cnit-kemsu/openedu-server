USE openedu;
SET collation_connection = utf8mb4_unicode_ci;

DELIMITER //

CREATE OR REPLACE PROCEDURE move_course_design_unit(p_movable_unit_id INT UNSIGNED, p_front_unit_id INT UNSIGNED)
BEGIN
	DECLARE v_counter TINYINT UNSIGNED DEFAULT 0;
	DECLARE v_id INT UNSIGNED;
	DECLARE v_done TINYINT(1) DEFAULT 0;
	DECLARE v_cursor CURSOR FOR SELECT id FROM course_design_units WHERE subsection_id = (SELECT subsection_id FROM course_design_units WHERE id = p_movable_unit_id) ORDER BY -index_number DESC;
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
	
	OPEN v_cursor;
	v_loop: LOOP
		FETCH v_cursor INTO v_id;
		IF v_done THEN LEAVE v_loop; END IF;
		
		IF v_id = p_front_unit_id THEN
			UPDATE course_design_units SET index_number = v_counter WHERE id = p_movable_unit_id;
			SET v_counter = v_counter + 1;
		END IF;
		
		IF v_id != p_movable_unit_id THEN
			UPDATE course_design_units SET index_number = v_counter WHERE id = v_id;
			SET v_counter = v_counter + 1;
		END IF;
		
	END LOOP;
	CLOSE v_cursor;
	
	IF p_front_unit_id IS NULL THEN
		UPDATE course_design_units SET index_number = v_counter WHERE id = p_movable_unit_id;
	END IF;
END;

CREATE OR REPLACE PROCEDURE move_course_delivery_unit(p_movable_unit_id INT UNSIGNED, p_front_unit_id INT UNSIGNED)
BEGIN
	DECLARE v_counter TINYINT UNSIGNED DEFAULT 0;
	DECLARE v_id INT UNSIGNED;
	DECLARE v_done TINYINT(1) DEFAULT 0;
	DECLARE v_cursor CURSOR FOR SELECT id FROM course_delivery_units WHERE subsection_id = (SELECT subsection_id FROM course_delivery_units WHERE id = p_movable_unit_id) ORDER BY -index_number DESC;
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
	
	OPEN v_cursor;
	v_loop: LOOP
		FETCH v_cursor INTO v_id;
		IF v_done THEN LEAVE v_loop; END IF;
		
		IF v_id = p_front_unit_id THEN
			UPDATE course_delivery_units SET index_number = v_counter WHERE id = p_movable_unit_id;
			SET v_counter = v_counter + 1;
		END IF;
		
		IF v_id != p_movable_unit_id THEN
			UPDATE course_delivery_units SET index_number = v_counter WHERE id = v_id;
			SET v_counter = v_counter + 1;
		END IF;
		
	END LOOP;
	CLOSE v_cursor;
	
	IF p_front_unit_id IS NULL THEN
		UPDATE course_delivery_units SET index_number = v_counter WHERE id = p_movable_unit_id;
	END IF;
END;

CREATE OR REPLACE FUNCTION get_value(p_value_id INT UNSIGNED) RETURNS LONGTEXT
BEGIN
	RETURN (SELECT _value FROM _values WHERE id = p_value_id);
END;

CREATE OR REPLACE FUNCTION get_user_role(p_user_id INT UNSIGNED) RETURNS TINYTEXT
BEGIN
	DECLARE v_role TINYTEXT;
	SELECT role INTO v_role FROM users WHERE id = p_user_id;
	RETURN v_role;
END;

CREATE OR REPLACE FUNCTION get_session_user_role() RETURNS TINYTEXT
BEGIN
	RETURN @role;
END;


CREATE OR REPLACE FUNCTION get_course_design_template_creator_id(p_course_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	RETURN (
		SELECT creator_id FROM course_design_templates WHERE id = p_course_id
	);
END;

CREATE OR REPLACE FUNCTION get_course_design_section_creator_id(p_section_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	RETURN (
		SELECT creator_id FROM course_design_templates WHERE id = (
			SELECT course_id FROM course_design_sections WHERE id = p_section_id
		)
	);
END;

CREATE OR REPLACE FUNCTION get_course_design_subsection_creator_id(p_subsection_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	RETURN (
		SELECT creator_id FROM course_design_templates WHERE id = (
			SELECT course_id FROM course_design_sections WHERE id = (
				SELECT section_id FROM course_design_subsections WHERE id = p_subsection_id
			)
		)
	);
END;

CREATE OR REPLACE FUNCTION get_course_design_unit_creator_id(p_unit_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	RETURN (
		SELECT creator_id FROM course_design_templates WHERE id = (
			SELECT course_id FROM course_design_sections WHERE id = (
				SELECT section_id FROM course_design_subsections WHERE id = (
					SELECT subsection_id FROM course_design_units WHERE id = p_unit_id
				)
			)
		)
	);
END;

CREATE OR REPLACE FUNCTION get_course_delivery_instance_creator_id(p_course_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	RETURN (
		SELECT creator_id FROM course_delivery_instances WHERE id = p_course_id
	);
END;

CREATE OR REPLACE FUNCTION get_course_delivery_section_creator_id(p_section_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	RETURN (
		SELECT creator_id FROM course_delivery_instances WHERE id = (
			SELECT course_id FROM course_delivery_sections WHERE id = p_section_id
		)
	);
END;

CREATE OR REPLACE FUNCTION get_course_delivery_subsection_creator_id(p_subsection_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	RETURN (
		SELECT creator_id FROM course_delivery_instances WHERE id = (
			SELECT course_id FROM course_delivery_sections WHERE id = (
				SELECT section_id FROM course_delivery_subsections WHERE id = p_subsection_id
			)
		)
	);
END;

CREATE OR REPLACE FUNCTION get_course_delivery_unit_creator_id(p_unit_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	RETURN (
		SELECT creator_id FROM course_delivery_instances WHERE id = (
			SELECT course_id FROM course_delivery_sections WHERE id = (
				SELECT section_id FROM course_delivery_subsections WHERE id = (
					SELECT subsection_id FROM course_delivery_units WHERE id = p_unit_id
				)
			)
		)
	);
END;

CREATE OR REPLACE FUNCTION is_course_instructor(p_course_id INT UNSIGNED, p_user_id INT UNSIGNED) RETURNS TINYINT(1)
BEGIN
	RETURN (SELECT 1 FROM instructor_assignments WHERE course_id = p_course_id AND user_id = p_user_id);
END;

CREATE OR REPLACE PROCEDURE enroll_user_in_free_course(p_user_id INT UNSIGNED, p_course_id INT UNSIGNED)
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

CREATE OR REPLACE FUNCTION is_enrolled_to_course(p_user_id INT UNSIGNED, p_course_id INT UNSIGNED) RETURNS TINYINT(1)
BEGIN
	RETURN (
		SELECT 1 FROM free_course_enrollments WHERE user_id = p_user_id AND course_id = p_course_id
		UNION ALL
		SELECT 1 FROM paid_course_purchases WHERE user_id = p_user_id AND course_id = p_course_id AND callback_status = 'success'
	);
END;

CREATE OR REPLACE FUNCTION is_await_purchase_completion(p_user_id INT UNSIGNED, p_course_id INT UNSIGNED) RETURNS TINYINT(1)
BEGIN
	RETURN (
		SELECT 1 FROM paid_course_purchases WHERE user_id = p_user_id AND course_id = p_course_id AND callback_status = null
	);
END;

CREATE OR REPLACE PROCEDURE throw_error(p_message_text TINYTEXT)
BEGIN
	SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = p_message_text;
END;

CREATE OR REPLACE PROCEDURE verify_session_user_role_assigned(p_user_id INT UNSIGNED)
BEGIN
	IF @role IS NULL THEN
		SELECT role INTO @role FROM users WHERE id = p_user_id;
		IF @role IS NULL THEN SET @role = 'null'; END IF;
	END IF;
END;

CREATE OR REPLACE FUNCTION check_user_access_to_entry(p_user_id INT UNSIGNED, p_entity_type ENUM(
	'course_design_unit',
	'course_delivery_subsection',
	'course_delivery_unit'
), p_instance_id INT UNSIGNED) RETURNS TINYTEXT
BEGIN
	DECLARE v_has_access TINYINT(1) DEFAULT 0;
	DECLARE v_access_date DATETIME;
	
	CALL verify_session_user_role_assigned(p_user_id);
	IF @role = 'null' THEN RETURN 'undefined user'; END IF;
	
	IF @role = 'superuser' THEN RETURN 'ok'; END IF;
	IF @role = 'admin' THEN RETURN 'ok'; END IF;
	
	IF @role = 'instructor' THEN
		
		IF p_entity_type = 'course_delivery_subsection' THEN
			SELECT 1 INTO v_has_access FROM instructor_assignments AS e
			JOIN course_delivery_sections AS s ON s.course_id = e.course_id
			JOIN course_delivery_subsections AS ss ON ss.section_id = s.id
			WHERE user_id = p_user_id AND ss.id = p_instance_id;
			IF NOT v_has_access THEN RETURN 'not assigned'; END IF;
		END IF;
		
		IF p_entity_type = 'course_delivery_unit' THEN
			SELECT 1 INTO v_has_access FROM instructor_assignments AS e
			JOIN course_delivery_sections AS s ON s.course_id = e.course_id
			JOIN course_delivery_subsections AS ss ON ss.section_id = s.id
			JOIN course_delivery_units AS u ON u.subsection_id = ss.id
			WHERE user_id = p_user_id AND u.id = p_instance_id;
			IF NOT v_has_access THEN RETURN 'not assigned'; END IF;
		END IF;
		
	END IF;
	
	IF @role = 'student' THEN
		
		IF p_entity_type = 'course_delivery_subsection' THEN
			SELECT 1, access_date INTO v_has_access, v_access_date FROM (SELECT user_id, course_id FROM free_course_enrollments UNION ALL SELECT user_id, course_id FROM paid_course_purchases WHERE callback_status = 'success') AS e
			JOIN course_delivery_sections AS s ON s.course_id = e.course_id
			JOIN course_delivery_subsections AS ss ON ss.section_id = s.id
			WHERE user_id = p_user_id AND ss.id = p_instance_id;
			IF NOT v_has_access THEN RETURN 'not enrolled'; END IF;
			IF v_access_date > NOW() THEN RETURN 'access closed'; END IF;
		END IF;
		
		IF p_entity_type = 'course_delivery_unit' THEN
			SELECT 1, access_date INTO v_has_access, v_access_date FROM (SELECT user_id, course_id FROM free_course_enrollments UNION ALL SELECT user_id, course_id FROM paid_course_purchases WHERE callback_status = 'success') AS e
			JOIN course_delivery_sections AS s ON s.course_id = e.course_id
			JOIN course_delivery_subsections AS ss ON ss.section_id = s.id
			JOIN course_delivery_units AS u ON u.subsection_id = ss.id
			WHERE user_id = p_user_id AND u.id = p_instance_id;
			IF NOT v_has_access THEN RETURN 'not enrolled'; END IF;
			IF v_access_date > NOW() THEN RETURN 'access closed'; END IF;
		END IF;
		
	END IF;
	
	RETURN 'undefined entry';
END;


//
DELIMITER ;