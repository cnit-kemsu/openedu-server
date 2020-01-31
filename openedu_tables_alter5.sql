USE openedu;

ALTER TABLE course_design_sections
	CHANGE COLUMN IF EXISTS _name _name TEXT NOT NULL COLLATE 'utf8mb4_unicode_ci';

ALTER TABLE course_design_subsections
	CHANGE COLUMN IF EXISTS _name _name TEXT NOT NULL COLLATE 'utf8mb4_unicode_ci';

ALTER TABLE course_design_units
	CHANGE COLUMN IF EXISTS _name _name TEXT NOT NULL COLLATE 'utf8mb4_unicode_ci';

ALTER TABLE course_delivery_sections
	CHANGE COLUMN IF EXISTS _name _name TEXT NOT NULL COLLATE 'utf8mb4_unicode_ci';

ALTER TABLE course_delivery_subsections
	CHANGE COLUMN IF EXISTS _name _name TEXT NOT NULL COLLATE 'utf8mb4_unicode_ci';

ALTER TABLE course_delivery_units
	CHANGE COLUMN IF EXISTS _name _name TEXT NOT NULL COLLATE 'utf8mb4_unicode_ci';