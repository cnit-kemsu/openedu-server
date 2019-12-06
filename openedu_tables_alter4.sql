USE openedu;

ALTER TABLE course_design_sections
	ADD COLUMN IF NOT EXISTS index_number TINYINT UNSIGNED;

ALTER TABLE course_design_subsections
	ADD COLUMN IF NOT EXISTS index_number TINYINT UNSIGNED;

ALTER TABLE course_delivery_sections
	ADD COLUMN IF NOT EXISTS index_number TINYINT UNSIGNED;

ALTER TABLE course_delivery_subsections
	ADD COLUMN IF NOT EXISTS index_number TINYINT UNSIGNED;
	
ALTER TABLE quiz_attempts
	DROP FOREIGN KEY IF EXISTS quiz_attempts_ibfk_3,
	DROP PRIMARY KEY,
	ADD PRIMARY KEY (user_id, unit_id, data_value_id)
