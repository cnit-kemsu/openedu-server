USE openedu;

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