USE openedu;

ALTER TABLE course_design_templates
	DROP COLUMN IF EXISTS default_price,
	ADD COLUMN IF NOT EXISTS defunct TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE course_delivery_instances
	CHANGE COLUMN IF EXISTS course_design_id course_design_template_id INT UNSIGNED,
	ADD COLUMN IF NOT EXISTS defunct TINYINT(1) NOT NULL DEFAULT 0,
	MODIFY COLUMN IF EXISTS price DECIMAL(11, 2) UNSIGNED;

DELIMITER //

IF (SELECT 1 FROM information_schema.tables WHERE table_schema = 'openedu' AND table_name = 'course_delivery_instructors') THEN
	RENAME TABLE course_delivery_instructors TO instructor_assignments;
END IF;

IF (SELECT 1 FROM information_schema.tables WHERE table_schema = 'openedu' AND table_name = 'enrollments') THEN
	RENAME TABLE enrollments TO free_course_enrollments;
END IF;

//
DELIMITER ;
	
ALTER TABLE instructor_assignments
	CHANGE COLUMN IF EXISTS course_delivery_instance_id course_id INT UNSIGNED;
	
ALTER TABLE free_course_enrollments
	CHANGE COLUMN IF EXISTS enroll_date enrollment_date DATETIME;
	
ALTER TABLE quiz_attempts
	CHANGE COLUMN IF EXISTS course_delivery_unit_id unit_id INT UNSIGNED,
	CHANGE COLUMN IF EXISTS started start_date DATETIME NOT NULL,
	CHANGE COLUMN IF EXISTS final_attempt last_submit_date DATETIME,
	CHANGE COLUMN IF EXISTS result last_submitted_reply LONGTEXT,
	CHANGE COLUMN IF EXISTS _count replies_count SMALLINT UNSIGNED DEFAULT 0,
	ADD COLUMN IF NOT EXISTS last_fixed_reply LONGTEXT,
	ADD COLUMN IF NOT EXISTS feedback LONGTEXT;