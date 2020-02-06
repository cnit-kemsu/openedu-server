USE openedu;

CREATE TABLE course_pass_tokens (

	id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  comments LONGTEXT,
	emails LONGTEXT,
  
  PRIMARY KEY(id),
	FOREIGN KEY(course_id) REFERENCES course_delivery_instances(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE user_pass_tokens (

  course_token_id INT UNSIGNED NOT NULL,
	user_id INT UNSIGNED,
  email VARCHAR(50) NOT NULL,
  
  PRIMARY KEY(course_token_id, email),
	FOREIGN KEY(course_token_id) REFERENCES course_pass_tokens(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);