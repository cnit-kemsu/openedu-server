USE openedu;

ALTER TABLE users
	ADD COLUMN IF NOT EXISTS pwdreset_token TINYTEXT;
