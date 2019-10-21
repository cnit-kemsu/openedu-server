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
  FOREIGN KEY (value_id) REFERENCES _values(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE TABLE users (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role ENUM('superuser', 'admin', 'instructor', 'student') NOT NULL,
  email VARCHAR(50) NOT NULL,
  pwdhash VARCHAR(132),
  _data LONGTEXT,
  picture_value_id INT UNSIGNED,

  PRIMARY KEY(id),
  UNIQUE(email),
  FOREIGN KEY (picture_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE unverified_accounts (

  user_id INT UNSIGNED NOT NULL,
  passkey VARCHAR(20) NOT NULL,
  delivered TINYINT(1) NOT NULL DEFAULT 0,

  PRIMARY KEY(user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE course_design_templates (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  _name VARCHAR(100) NOT NULL,
  summary_value_id INT UNSIGNED,
  description_value_id INT UNSIGNED,
  picture_value_id INT UNSIGNED,

  creator_id INT UNSIGNED NOT NULL,
  default_price FLOAT,
  
  PRIMARY KEY(id),
  UNIQUE(_name),
  FOREIGN KEY (summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY (description_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY (picture_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_delivery_instances (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  _name VARCHAR(100) NOT NULL,
  summary_value_id INT UNSIGNED,
  description_value_id INT UNSIGNED,
  picture_value_id INT UNSIGNED,

	course_design_id INT UNSIGNED,
  creator_id INT UNSIGNED NOT NULL,
  creation_date DATETIME NOT NULL,
  start_date DATETIME,
  enrollment_end_date DATETIME,
  price FLOAT,
  
  PRIMARY KEY(id),
  FOREIGN KEY (summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY (description_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY (picture_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_design_sections (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  _name VARCHAR(100) NOT NULL,
  summary_value_id INT UNSIGNED,
  
  PRIMARY KEY(id),
  UNIQUE(_name, course_id),
  FOREIGN KEY(course_id) REFERENCES course_design_templates(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY (summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_delivery_sections (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  _name VARCHAR(100) NOT NULL,
  summary_value_id INT UNSIGNED,
  
  PRIMARY KEY(id),
  UNIQUE(_name, course_id),
  FOREIGN KEY(course_id) REFERENCES course_delivery_instances(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY (summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_design_subsections (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id INT UNSIGNED NOT NULL,
  _name VARCHAR(100) NOT NULL,
  summary_value_id INT UNSIGNED,

  access_period INT UNSIGNED,
  expiration_period INT UNSIGNED,
  
  PRIMARY KEY(id),
  UNIQUE(_name, section_id),
  FOREIGN KEY(section_id) REFERENCES course_design_sections(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY (summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_delivery_subsections (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id INT UNSIGNED NOT NULL,
  _name VARCHAR(100) NOT NULL,
  summary_value_id INT UNSIGNED,

  access_date DATETIME,
  expiration_date DATETIME,
  
  PRIMARY KEY(id),
  UNIQUE(_name, section_id),
  FOREIGN KEY(section_id) REFERENCES course_delivery_sections(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY (summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_design_units (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  subsection_id INT UNSIGNED NOT NULL,
  _name VARCHAR(100) NOT NULL,
  summary_value_id INT UNSIGNED,
  _type ENUM('document', 'video', 'quiz') NOT NULL,
  data_value_id INT UNSIGNED,
  
  PRIMARY KEY(id),
  UNIQUE(_name, subsection_id),
  FOREIGN KEY(subsection_id) REFERENCES course_design_subsections(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY (summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY (data_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);

CREATE TABLE course_delivery_units (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  subsection_id INT UNSIGNED NOT NULL,
  _name VARCHAR(100) NOT NULL,
  summary_value_id INT UNSIGNED,
  _type ENUM('document', 'video', 'quiz') NOT NULL,
  data_value_id INT UNSIGNED,
  
  PRIMARY KEY(id),
  UNIQUE(_name, subsection_id),
  FOREIGN KEY(subsection_id) REFERENCES course_delivery_subsections(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  FOREIGN KEY (summary_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL,
  FOREIGN KEY (data_value_id) REFERENCES _values(id) ON DELETE SET NULL ON UPDATE SET NULL
);






CREATE TABLE enrollments (

  user_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  enroll_date DATETIME NOT NULL,

  PRIMARY KEY(user_id, course_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY(course_id) REFERENCES course_delivery_instances(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE quiz_attempts (

  user_id INT UNSIGNED NOT NULL,
  course_delivery_unit_id INT UNSIGNED,
  data_value_id INT UNSIGNED NOT NULL,
  started DATETIME NOT NULL,
  final_attempt DATETIME,
  result LONGTEXT,
  score SMALLINT UNSIGNED,
  _count SMALLINT UNSIGNED DEFAULT 0,
  
  PRIMARY KEY(user_id, data_value_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (data_value_id) REFERENCES _values(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (course_delivery_unit_id) REFERENCES course_delivery_units(id) ON DELETE SET NULL ON UPDATE CASCADE
);


CREATE TABLE course_delivery_instructors (

  user_id INT UNSIGNED NOT NULL,
  course_delivery_instance_id INT UNSIGNED,
  accepted TINYINT(1),
  
  
  PRIMARY KEY(user_id, course_delivery_instance_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (course_delivery_instance_id) REFERENCES course_delivery_instances(id) ON DELETE CASCADE ON UPDATE CASCADE
);





DELIMITER //






CREATE OR REPLACE PROCEDURE start_quiz_attempt(p_user_id INT UNSIGNED, p_course_delivery_unit_id INT UNSIGNED)
BEGIN
  DECLARE v_data_value_id INT UNSIGNED DEFAULT (SELECT data_value_id FROM course_delivery_units WHERE id = p_course_delivery_unit_id);
  SELECT increase_value_total_attachments(v_data_value_id);
  INSERT INTO quiz_attempts (user_id, course_delivery_unit_id, data_value_id, started) VALUES (p_user_id, p_course_delivery_unit_id, v_data_value_id, NOW());
END;

CREATE OR REPLACE PROCEDURE make_quiz_attempt(p_user_id INT UNSIGNED, p_course_delivery_unit_id INT UNSIGNED, p_result LONGTEXT, p_score SMALLINT UNSIGNED)
BEGIN
  UPDATE quiz_attempts SET final_attempt = NOW(), result = p_result, score = p_score, _count = _count + 1 WHERE user_id = p_user_id AND course_delivery_unit_id = p_course_delivery_unit_id;
END;
CREATE OR REPLACE TRIGGER after_quiz_attempt_delete AFTER DELETE ON quiz_attempts FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.data_value_id);
END;







CREATE OR REPLACE FUNCTION create_file(p_mimetype TINYTEXT, p_buffer MEDIUMBLOB) RETURNS INT UNSIGNED
BEGIN
	INSERT INTO files SET mimetype = p_mimetype, _buffer = p_buffer;
	RETURN LAST_INSERT_ID();
END;

CREATE OR REPLACE PROCEDURE create_file_to_value_attachments(p_value_id INT UNSIGNED, p_file_id_array TEXT)
BEGIN
	DECLARE v_curr_comma_pos INT DEFAULT 0;
	DECLARE v_next_comma_pos INT DEFAULT LOCATE(',', p_file_id_array);
	DECLARE v_file_id INT;
	
	IF v_next_comma_pos = 0 THEN
		INSERT INTO file_to_value_attachments SET value_id = p_value_id, file_id = CONVERT(p_file_id_array, UNSIGNED) ON DUPLICATE KEY UPDATE value_id = value_id;
	ELSE
	
		WHILE v_next_comma_pos > 0 DO
	    SET v_file_id = CONVERT(SUBSTRING(p_file_id_array, v_curr_comma_pos + 1, v_next_comma_pos - v_curr_comma_pos - 1), UNSIGNED);
	    INSERT INTO file_to_value_attachments SET value_id = p_value_id, file_id = v_file_id ON DUPLICATE KEY UPDATE value_id = value_id;
	    SET v_curr_comma_pos = v_next_comma_pos;
	    SET v_next_comma_pos = LOCATE(',', p_file_id_array, v_curr_comma_pos + 1);
		END WHILE;
		
		SET v_file_id = CONVERT(SUBSTRING(p_file_id_array, v_curr_comma_pos + 1), UNSIGNED);
		INSERT INTO file_to_value_attachments SET value_id = p_value_id, file_id = v_file_id ON DUPLICATE KEY UPDATE value_id = value_id;
		
	END IF;
END;

CREATE OR REPLACE PROCEDURE update_file_to_value_attachments(p_value_id INT UNSIGNED, p_file_id_array TEXT)
BEGIN
	IF p_file_id_array = '' THEN
		DELETE FROM file_to_value_attachments WHERE value_id = p_value_id;
	ELSE
		DELETE FROM file_to_value_attachments WHERE value_id = p_value_id AND FIND_IN_SET(file_id, p_file_id_array) = 0;
		CALL create_file_to_value_attachments(p_value_id, p_file_id_array);
	END IF;
END;

CREATE OR REPLACE FUNCTION create_value(p_value LONGTEXT, p_file_id_array MEDIUMTEXT) RETURNS INT UNSIGNED
BEGIN
	DECLARE v_value_id INT UNSIGNED;
	
	IF p_value IS NULL THEN
		RETURN NULL;
	END IF;
	
	INSERT INTO _values SET _value = p_value;
	SET v_value_id = LAST_INSERT_ID();
	IF p_file_id_array IS NOT NULL AND p_file_id_array != '' THEN
		CALL create_file_to_value_attachments(v_value_id, p_file_id_array);
	END IF;
	
	RETURN v_value_id;
END;

CREATE OR REPLACE FUNCTION update_value(p_value_id INT UNSIGNED, p_value LONGTEXT, p_file_id_array TEXT) RETURNS INT UNSIGNED
BEGIN
  DECLARE v_total_attachments INT UNSIGNED DEFAULT IF(p_value_id IS NULL, 0, (SELECT total_attachments FROM _values WHERE id = p_value_id));
  DECLARE v_value_id INT UNSIGNED;
  
  IF p_value IS NULL THEN
  	IF v_total_attachments = 1 THEN
			DELETE FROM _values WHERE id = p_value_id;
		END IF;
  	RETURN NULL;
	END IF;

	IF v_total_attachments = 1 THEN
		UPDATE _values SET _value = p_value WHERE id = p_value_id;
		IF p_file_id_array IS NOT NULL THEN
			CALL update_file_to_value_attachments(p_value_id, p_file_id_array);
		END IF;
		RETURN p_value_id;
	ELSE
		INSERT INTO _values SET _value = p_value;
		SET v_value_id = LAST_INSERT_ID();
		CALL decrease_value_total_attachments(p_value_id);
		IF p_file_id_array IS NOT NULL AND p_file_id_array != '' THEN
			CALL create_file_to_value_attachments(v_value_id, p_file_id_array);
		END IF;
		RETURN v_value_id;
	END IF;
END;

CREATE OR REPLACE FUNCTION increase_value_total_attachments(p_value_id INT UNSIGNED) RETURNS INT UNSIGNED
BEGIN
	IF p_value_id IS NULL THEN
		RETURN NULL;
	ELSE
		UPDATE _values SET total_attachments = total_attachments + 1 WHERE id = p_value_id;
		RETURN p_value_id;
	END IF;
END;

CREATE OR REPLACE PROCEDURE decrease_value_total_attachments(p_value_id INT UNSIGNED)
BEGIN
	IF p_value_id IS NOT NULL THEN
		IF (SELECT total_attachments FROM _values WHERE id = p_value_id) = 1 THEN
			DELETE FROM _values WHERE id = p_value_id;
		ELSE
			UPDATE _values SET total_attachments = total_attachments - 1 WHERE id = p_value_id;
		END IF;
	END IF;
END;

CREATE OR REPLACE TRIGGER before_value_delete BEFORE DELETE ON _values FOR EACH ROW
BEGIN
	DELETE FROM file_to_value_attachments WHERE value_id = OLD.id;
END;

CREATE OR REPLACE TRIGGER after_file_to_value_attachment_delete AFTER DELETE ON file_to_value_attachments FOR EACH ROW
BEGIN
	IF (SELECT COUNT(1) FROM file_to_value_attachments WHERE file_id = OLD.file_id) = 0 THEN
		DELETE FROM files WHERE id = OLD.file_id;
	END IF;
END;

CREATE OR REPLACE FUNCTION create_course_delivery_instance(p_course_design_id INT UNSIGNED, p_creator_id INT UNSIGNED, p_creation_date DATETIME, p_start_date DATETIME, p_enrollment_end_date DATETIME, p_price FLOAT) RETURNS INT UNSIGNED
BEGIN
	DECLARE v_insert_id INT UNSIGNED;
	
	IF (SELECT COUNT(1) FROM course_design_units WHERE subsection_id IN (
		SELECT id FROM course_design_subsections WHERE section_id IN (SELECT id FROM course_design_sections WHERE course_id = p_course_design_id)
	) AND data_value_id IS NULL) > 0 THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot create course delivery instance, because one or more of it\'s units has data_value_id is set to NULL';
	END IF;
	
	INSERT INTO course_delivery_instances SELECT
		NULL,
		_name,
		increase_value_total_attachments(summary_value_id),
		increase_value_total_attachments(description_value_id),
		increase_value_total_attachments(picture_value_id),
		p_course_design_id,
		p_creator_id,
		p_creation_date,
		p_start_date,
		p_enrollment_end_date,
		IF (p_price IS NULL, default_price, p_price)
	FROM course_design_templates WHERE id = p_course_design_id;
	SET v_insert_id = LAST_INSERT_ID();
	
	CALL create_course_delivery_sections(p_course_design_id, p_start_date, LAST_INSERT_ID());
	
	RETURN v_insert_id;
END;

CREATE OR REPLACE PROCEDURE create_course_delivery_sections(p_course_design_id INT, p_start_date DATETIME, p_course_delivery_id INT)
BEGIN
	DECLARE v_id INT;
	DECLARE v_name LONGTEXT;
  DECLARE v_summary_value_id LONGTEXT;
  DECLARE v_done INT DEFAULT FALSE;
	DECLARE v_cursor CURSOR FOR SELECT id, _name, summary_value_id FROM course_design_sections WHERE course_id = p_course_design_id;
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

	OPEN v_cursor;
	v_loop: LOOP
		FETCH v_cursor INTO v_id, v_name, v_summary_value_id;
		IF v_done THEN LEAVE v_loop; END IF;
		
		INSERT INTO course_delivery_sections VALUES (
			NULL,
			p_course_delivery_id,
			v_name,
			increase_value_total_attachments(v_summary_value_id)
		);
		
		CALL create_course_delivery_subsections(v_id, p_start_date, LAST_INSERT_ID());
	END LOOP;
	CLOSE v_cursor;
END;

CREATE OR REPLACE PROCEDURE create_course_delivery_subsections(p_design_section_id INT, p_start_date DATETIME, p_delivery_section_id INT)
BEGIN
  DECLARE v_id INT;
	DECLARE v_name VARCHAR(100);
  DECLARE v_summary_value_id LONGTEXT;
	DECLARE v_access_period INT UNSIGNED;
  DECLARE v_expiration_period INT UNSIGNED;
  DECLARE v_done INT DEFAULT FALSE;
	DECLARE v_cursor CURSOR FOR SELECT id, _name, summary_value_id, access_period, expiration_period FROM course_design_subsections WHERE section_id = p_design_section_id;
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

	OPEN v_cursor;
	v_loop: LOOP
		FETCH v_cursor INTO v_id, v_name, v_summary_value_id, v_access_period, v_expiration_period;
		IF v_done THEN LEAVE v_loop; END IF;
		
		INSERT INTO course_delivery_subsections VALUES (
			NULL,
			p_delivery_section_id,
			v_name,
			increase_value_total_attachments(v_summary_value_id),
			IF(v_access_period IS NULL, NULL, DATE_ADD(p_start_date, INTERVAL v_access_period DAY)),
			IF(v_expiration_period IS NULL, NULL, DATE_ADD(p_start_date, INTERVAL v_expiration_period DAY))
		);
		
		INSERT INTO course_delivery_units SELECT 
			NULL,
			LAST_INSERT_ID(),
			_name,
			increase_value_total_attachments(summary_value_id),
			_type,
			increase_value_total_attachments(data_value_id)
		FROM course_design_units WHERE subsection_id = v_id;
	END LOOP;
	CLOSE v_cursor;
END;

CREATE OR REPLACE TRIGGER after_user_delete AFTER DELETE ON users FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.picture_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_design_template_delete BEFORE DELETE ON course_design_templates FOR EACH ROW
BEGIN
	DELETE FROM course_design_sections WHERE course_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_design_template_delete AFTER DELETE ON course_design_templates FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
	CALL decrease_value_total_attachments(OLD.description_value_id);
	CALL decrease_value_total_attachments(OLD.picture_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_delivery_instance_delete BEFORE DELETE ON course_delivery_instances FOR EACH ROW
BEGIN
	DELETE FROM course_delivery_sections WHERE course_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_delivery_instance_delete AFTER DELETE ON course_delivery_instances FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
	CALL decrease_value_total_attachments(OLD.description_value_id);
	CALL decrease_value_total_attachments(OLD.picture_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_design_section_delete BEFORE DELETE ON course_design_sections FOR EACH ROW
BEGIN
	DELETE FROM course_design_subsections WHERE section_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_design_section_delete AFTER DELETE ON course_design_sections FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_delivery_section_delete BEFORE DELETE ON course_delivery_sections FOR EACH ROW
BEGIN
	DELETE FROM course_delivery_subsections WHERE section_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_delivery_section_delete AFTER DELETE ON course_delivery_sections FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_design_subsection_delete BEFORE DELETE ON course_design_subsections FOR EACH ROW
BEGIN
	DELETE FROM course_design_units WHERE subsection_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_design_subsection_delete AFTER DELETE ON course_design_subsections FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER before_course_delivery_subsection_delete BEFORE DELETE ON course_delivery_subsections FOR EACH ROW
BEGIN
	DELETE FROM course_delivery_units WHERE subsection_id = OLD.id;
END;
CREATE OR REPLACE TRIGGER after_course_delivery_subsection_delete AFTER DELETE ON course_delivery_subsections FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
END;

CREATE OR REPLACE TRIGGER after_course_design_unit_delete AFTER DELETE ON course_design_units FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
	CALL decrease_value_total_attachments(OLD.data_value_id);
END;

CREATE OR REPLACE TRIGGER after_course_delivery_unit_delete AFTER DELETE ON course_delivery_units FOR EACH ROW
BEGIN
	CALL decrease_value_total_attachments(OLD.summary_value_id);
	CALL decrease_value_total_attachments(OLD.data_value_id);
END;

//
DELIMITER ;