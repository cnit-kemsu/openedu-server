USE openedu;

ALTER TABLE course_design_templates
	ADD COLUMN IF NOT EXISTS _data LONGTEXT;

ALTER TABLE course_delivery_instances
	ADD COLUMN IF NOT EXISTS _data LONGTEXT;

ALTER TABLE free_course_enrollments
	ADD COLUMN IF NOT EXISTS _data LONGTEXT;

ALTER TABLE paid_course_purchases
	ADD COLUMN IF NOT EXISTS _data LONGTEXT;