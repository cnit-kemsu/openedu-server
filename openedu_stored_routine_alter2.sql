USE openedu;
SET collation_connection = utf8mb4_unicode_ci;

DELIMITER //

CREATE OR REPLACE PROCEDURE check_user_ability_to_perform_quiz(p_user_id INT UNSIGNED, p_unit_id INT UNSIGNED)
BEGIN
  DECLARE v_has_access TINYINT(1) DEFAULT 0;
	DECLARE v_access_date DATETIME;
	DECLARE v_expiration_date DATETIME;
	DECLARE v_course_id INT UNSIGNED;
	DECLARE v_is_paid_course TINYINT(1);
  
  CALL verify_session_user_role_assigned(p_user_id);
  IF @role = 'null' THEN CALL throw_error('undefined user'); END IF;
	IF @role != 'student' THEN CALL throw_error('invalid role'); END IF;
	
	SELECT c.id, price IS NOT NULL, access_date, expiration_date INTO v_course_id, v_is_paid_course, v_access_date, v_expiration_date FROM course_delivery_instances AS c
	JOIN course_delivery_sections AS s ON s.course_id = c.id
	JOIN course_delivery_subsections AS ss ON ss.section_id = s.id
	JOIN course_delivery_units AS u ON u.subsection_id = ss.id
	WHERE u.id = p_unit_id;
	
	IF v_access_date > NOW() THEN CALL throw_error('access closed'); END IF;
	IF v_expiration_date < NOW() THEN CALL throw_error('access expired'); END IF;
	
	IF v_is_paid_course THEN
		SELECT 1 INTO v_has_access FROM paid_course_purchases WHERE course_id = v_course_id AND user_id = p_user_id AND callback_status = 'success' LIMIT 1;
	ELSE
		SELECT 1 INTO v_has_access FROM free_course_enrollments WHERE course_id = v_course_id AND user_id = p_user_id LIMIT 1;
	END IF;
	
	IF NOT v_has_access THEN CALL throw_error('not enrolled'); END IF;
	
END;

//
DELIMITER ;