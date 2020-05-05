USE openedu;
SET collation_connection = utf8mb4_unicode_ci;

DELIMITER //

CREATE OR REPLACE FUNCTION set_instructor_assignments(p_course_id INT UNSIGNED, p_user_id_array JSON) RETURNS JSON
BEGIN
	DECLARE v_diff JSON DEFAULT '{ "exclude_user_keys": [], "include_user_keys": [] }';
	DECLARE v_user_id INT UNSIGNED;
	
	FOR _assignment IN (SELECT user_id FROM instructor_assignments WHERE course_id = p_course_id) DO
		IF NOT JSON_CONTAINS(p_user_id_array, _assignment.user_id) THEN
			DELETE FROM instructor_assignments WHERE course_id = p_course_id AND user_id = _assignment.user_id;
			SET v_diff = JSON_ARRAY_APPEND(v_diff, '$.exclude_user_keys', _assignment.user_id);
		END IF;
	END FOR;
	
	FOR _index IN 0 .. JSON_LENGTH(p_user_id_array) - 1 DO
		SET v_user_id = JSON_VALUE(p_user_id_array, CONCAT('$[', _index, ']'));
		IF NOT EXISTS(SELECT 1 FROM instructor_assignments WHERE course_id = p_course_id AND user_id = v_user_id) THEN
			INSERT INTO instructor_assignments SET course_id = p_course_id, user_id = v_user_id;
			SET v_diff = JSON_ARRAY_APPEND(v_diff, '$.include_user_keys', v_user_id);
		END IF;
	END FOR;
	
	RETURN v_diff;		
END;

//
DELIMITER ;