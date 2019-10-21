USE openedu;

CREATE TABLE paid_course_purchases (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id TEXT NOT NULL,
  purchase_date DATETIME NOT NULL DEFAULT NOW(),
  user_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  callback_status ENUM('success', 'failed'),
  callback_info TEXT,
  callback_date DATETIME,
  
  PRIMARY KEY(id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY(course_id) REFERENCES course_delivery_instances(id) ON DELETE CASCADE ON UPDATE CASCADE
);