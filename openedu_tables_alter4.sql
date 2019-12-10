USE openedu;

ALTER TABLE course_design_sections
	ADD COLUMN IF NOT EXISTS sequence_number TINYINT UNSIGNED;

ALTER TABLE course_design_subsections
	ADD COLUMN IF NOT EXISTS sequence_number TINYINT UNSIGNED;

ALTER TABLE course_delivery_sections
	ADD COLUMN IF NOT EXISTS sequence_number TINYINT UNSIGNED;

ALTER TABLE course_delivery_subsections
	ADD COLUMN IF NOT EXISTS sequence_number TINYINT UNSIGNED;

ALTER TABLE course_design_units
	CHANGE COLUMN IF EXISTS index_number sequence_number TINYINT UNSIGNED;

ALTER TABLE course_delivery_units
	CHANGE COLUMN IF EXISTS index_number sequence_number TINYINT UNSIGNED;

ALTER TABLE quiz_attempts
	DROP FOREIGN KEY IF EXISTS quiz_attempts_ibfk_3,
	ADD FOREIGN KEY(unit_id) REFERENCES course_delivery_units(id) ON DELETE CASCADE ON UPDATE CASCADE,
	DROP PRIMARY KEY,
	ADD PRIMARY KEY (user_id, unit_id, data_value_id);
