DROP DATABASE IF EXISTS openedu;
CREATE DATABASE openedu
CHARACTER SET = 'utf8mb4'
COLLATE = 'utf8mb4_unicode_ci';
USE openedu;

CREATE TABLE _values (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  _value LONGTEXT NOT NULL,
  total_attachments INT UNSIGNED NOT NULL DEFAULT 1,
  
  PRIMARY KEY(id)
);

CREATE TABLE files (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  mimetype TINYTEXT NOT NULL,
  _buffer MEDIUMBLOB NOT NULL,
  
  PRIMARY KEY(id)
);

CREATE TABLE file_to_value_attachments (

	value_id INT UNSIGNED NOT NULL,
  file_id INT UNSIGNED NOT NULL,
  
  PRIMARY KEY(value_id, file_id),
  FOREIGN KEY(value_id) REFERENCES _values(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE TABLE users (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role ENUM('superuser', 'admin', 'instructor', 'student') NOT NULL,
  email VARCHAR(50) NOT NULL,
  pwdhash VARCHAR(132),
  picture_value_id INT UNSIGNED,
  _data LONGTEXT,
  pwdreset_token TINYTEXT,

  PRIMARY KEY(id),
  UNIQUE(email),
  FOREIGN KEY(picture_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE unverified_accounts (

  user_id INT UNSIGNED NOT NULL,
  passkey VARCHAR(20) NOT NULL,
  delivered BOOLEAN NOT NULL DEFAULT FALSE,

  PRIMARY KEY(user_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE course_design_templates (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  _name VARCHAR(100) NOT NULL,
  summary_value_id INT UNSIGNED,
  description_value_id INT UNSIGNED,
  picture_value_id INT UNSIGNED,
  creator_id INT UNSIGNED NOT NULL,
  _data LONGTEXT,
  logo_value_id INT UNSIGNED,
  defunct BOOLEAN NOT NULL DEFAULT FALSE,
  
  PRIMARY KEY(id),
  UNIQUE(_name),
  FOREIGN KEY(summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY(description_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY(picture_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY(logo_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_delivery_instances (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  _name VARCHAR(100) NOT NULL,
  summary_value_id INT UNSIGNED,
  description_value_id INT UNSIGNED,
  picture_value_id INT UNSIGNED,
	creator_id INT UNSIGNED NOT NULL,
	_data LONGTEXT,
  logo_value_id INT UNSIGNED,
  defunct BOOLEAN NOT NULL DEFAULT FALSE,
  
  available_to_enroll BOOLEAN AS (enrollment_end_date > NOW() OR enrollment_end_date IS NULL) VIRTUAL,
  
	template_id INT UNSIGNED,
  creation_date DATETIME NOT NULL,
  start_date DATETIME,
  enrollment_end_date DATETIME,
  price DECIMAL(11, 2),
  
  PRIMARY KEY(id),
  FOREIGN KEY(summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY(description_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY(picture_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY(logo_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_design_sections (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  _name TEXT NOT NULL,
  summary_value_id INT UNSIGNED,
  sequence_number TINYINT UNSIGNED,
  
  PRIMARY KEY(id),
  UNIQUE(_name, course_id),
  FOREIGN KEY(course_id) REFERENCES course_design_templates(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY(summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_delivery_sections (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  _name TEXT NOT NULL,
  summary_value_id INT UNSIGNED,
  sequence_number TINYINT UNSIGNED,
  
  PRIMARY KEY(id),
  UNIQUE(_name, course_id),
  FOREIGN KEY( course_id) REFERENCES course_delivery_instances(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY(summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_design_subsections (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id INT UNSIGNED NOT NULL,
  _name TEXT NOT NULL,
  summary_value_id INT UNSIGNED,
  access_period INT UNSIGNED,
  expiration_period INT UNSIGNED,
  sequence_number TINYINT UNSIGNED,
  
  PRIMARY KEY(id),
  UNIQUE(_name, section_id),
  FOREIGN KEY(section_id) REFERENCES course_design_sections(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY(summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_delivery_subsections (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id INT UNSIGNED NOT NULL,
  _name TEXT NOT NULL,
  summary_value_id INT UNSIGNED,
  access_date DATETIME,
  expiration_date DATETIME,
  sequence_number TINYINT UNSIGNED,
  
  PRIMARY KEY(id),
  UNIQUE(_name, section_id),
  FOREIGN KEY(section_id) REFERENCES course_delivery_sections(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY(summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_design_units (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  subsection_id INT UNSIGNED NOT NULL,
  _name TEXT NOT NULL,
  summary_value_id INT UNSIGNED,
  _type ENUM('document', 'file-document', 'video', 'quiz') NOT NULL,
  data_value_id INT UNSIGNED,
  sequence_number TINYINT UNSIGNED,
  
  PRIMARY KEY(id),
  UNIQUE(_name, subsection_id),
  FOREIGN KEY(subsection_id) REFERENCES course_design_subsections(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY(summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY(data_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_delivery_units (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  subsection_id INT UNSIGNED NOT NULL,
  _name TEXT NOT NULL,
  summary_value_id INT UNSIGNED,
  _type ENUM('document', 'file-document', 'video', 'quiz') NOT NULL,
  data_value_id INT UNSIGNED,
  sequence_number TINYINT UNSIGNED,
  
  PRIMARY KEY(id),
  UNIQUE(_name, subsection_id),
  FOREIGN KEY(subsection_id) REFERENCES course_delivery_subsections(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY(summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY(data_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE instructor_assignments (

  user_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED,
  accepted BOOLEAN,
  
  PRIMARY KEY(user_id, course_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY(course_id) REFERENCES course_delivery_instances(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE free_course_enrollments (

  user_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  enrollment_date DATETIME NOT NULL DEFAULT NOW(),
  _data LONGTEXT,

  PRIMARY KEY(user_id, course_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY(course_id) REFERENCES course_delivery_instances(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE paid_course_purchases (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id TEXT NOT NULL,
  purchase_date DATETIME NOT NULL DEFAULT NOW(),
  user_id INT UNSIGNED,
  course_id INT UNSIGNED,
  callback_status ENUM('success', 'failed'),
  callback_info TEXT,
  callback_date DATETIME,
  _data LONGTEXT,
  
  PRIMARY KEY(id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY(course_id) REFERENCES course_delivery_instances(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE quiz_attempts (

  user_id INT UNSIGNED NOT NULL,
  unit_id INT UNSIGNED NOT NULL,
  data_value_id INT UNSIGNED NOT NULL,
  start_date DATETIME NOT NULL,
  last_submit_date DATETIME,
  last_submitted_reply LONGTEXT,
  score SMALLINT UNSIGNED,
  replies_count SMALLINT UNSIGNED DEFAULT 0,
  last_fixed_reply LONGTEXT,
	feedback LONGTEXT,
  
  PRIMARY KEY(user_id, unit_id, data_value_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY(unit_id) REFERENCES course_delivery_units(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY(data_value_id) REFERENCES _values(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE access_tokens (

	id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	_name TINYTEXT,
  comments TEXT,
  
  PRIMARY KEY(id)
);

CREATE TABLE access_token_course_attachments (

	access_token_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  
  PRIMARY KEY(access_token_id, course_id),
  FOREIGN KEY(access_token_id) REFERENCES access_tokens(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY(course_id) REFERENCES course_delivery_instances(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE access_token_user_attachments (

  access_token_id INT UNSIGNED NOT NULL,
  email VARCHAR(50) NOT NULL,
	user_id INT UNSIGNED,
  
  PRIMARY KEY(access_token_id, email),
	FOREIGN KEY(access_token_id) REFERENCES access_tokens(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);