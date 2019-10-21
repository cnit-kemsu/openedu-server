USE openedu;

ALTER TABLE course_design_units
	CHANGE COLUMN IF EXISTS _type _type ENUM('document', 'file-document', 'video', 'quiz') NOT NULL,
	ADD COLUMN IF NOT EXISTS index_number TINYINT UNSIGNED;
	
ALTER TABLE course_delivery_units
	CHANGE COLUMN IF EXISTS _type _type ENUM('document', 'file-document', 'video', 'quiz') NOT NULL,
	ADD COLUMN IF NOT EXISTS index_number TINYINT UNSIGNED;
	
