INSERT INTO offenses (column1, column2, column3, column4) VALUES
	('value', 2, 10, 0);

CREATE TABLE table (
	label VARCHAR(255) NOT NULL,
	number BIGINT NOT NULL,
	FOREIGN KEY (some_key) REFERENCES table(name)
);

ALTER TABLE some_table ADD some_column INT NOT NULL;