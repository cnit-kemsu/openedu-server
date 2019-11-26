USE openedu;
SET collation_connection = utf8mb4_unicode_ci;

DELIMITER //

CREATE OR REPLACE FUNCTION get_previous_subsection_delivery_id(p_subsection_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	DECLARE v_section_id INT UNSIGNED DEFAULT (SELECT section_id FROM course_delivery_subsections WHERE id = p_subsection_id);
	DECLARE v_course_id INT UNSIGNED DEFAULT (SELECT course_id FROM course_delivery_sections WHERE id = v_section_id);
	DECLARE v_is_first_in_section INT UNSIGNED DEFAULT (SELECT id = p_subsection_id FROM course_delivery_subsections WHERE section_id = v_section_id LIMIT 1);
	DECLARE v_previous_section_id INT UNSIGNED DEFAULT (SELECT id FROM course_delivery_sections WHERE course_id = v_course_id AND id < v_section_id ORDER BY id DESC LIMIT 1);
	
	IF v_is_first_in_section THEN
		RETURN (SELECT id FROM course_delivery_subsections WHERE section_id = v_previous_section_id ORDER BY id DESC LIMIT 1);
	END IF;
	
	RETURN (SELECT id FROM course_delivery_subsections WHERE section_id = v_section_id AND id < p_subsection_id ORDER BY id DESC LIMIT 1);
END;

CREATE OR REPLACE FUNCTION get_next_subsection_delivery_id(p_subsection_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	DECLARE v_section_id INT UNSIGNED DEFAULT (SELECT section_id FROM course_delivery_subsections WHERE id = p_subsection_id);
	DECLARE v_course_id INT UNSIGNED DEFAULT (SELECT course_id FROM course_delivery_sections WHERE id = v_section_id);
	DECLARE v_is_last_in_section INT UNSIGNED DEFAULT (SELECT id = p_subsection_id FROM course_delivery_subsections WHERE section_id = v_section_id ORDER BY id DESC LIMIT 1);
	DECLARE v_next_section_id INT UNSIGNED DEFAULT (SELECT id FROM course_delivery_sections WHERE course_id = v_course_id AND id > v_section_id LIMIT 1);
	
	IF v_is_last_in_section THEN
		RETURN (SELECT id FROM course_delivery_subsections WHERE section_id = v_next_section_id LIMIT 1);
	END IF;

	RETURN (SELECT id FROM course_delivery_subsections WHERE section_id = v_section_id AND id > p_subsection_id LIMIT 1);	
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
		0,
		_data
	FROM course_design_templates WHERE id = p_template_id;
	SET v_insert_id = LAST_INSERT_ID();
	
	CALL create_course_delivery_sections(p_template_id, p_start_date, LAST_INSERT_ID());
	
	RETURN v_insert_id;
END;

//
DELIMITER ;