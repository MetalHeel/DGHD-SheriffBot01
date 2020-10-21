INSERT INTO offenses (column1, column2, column3, column4) VALUES
	('value', 2, 10, 0);

CREATE TABLE table (
	label VARCHAR(255) NOT NULL,
	number BIGINT NOT NULL,
	FOREIGN KEY (some_key) REFERENCES table(name)
);

ALTER TABLE some_table ADD some_column INT NOT NULL;

UPDATE offenses SET reprimand_chance = 5 WHERE name = 'Lollygagging';

SELECT * FROM offense;

DELETE FROM jail WHERE offense_name = 'Lollygagging';

ALTER TABLE jail ADD incarceration_time INT NOT NULL;

DROP TABLE jail;

CREATE TABLE mention_response (
	mention_text VARCHAR(255) NOT NULL,
	response VARCHAR(255) NOT NULL
);

UPDATE message_variation SET variation = 'Welp, that''s a crime, ${user_mention}. Gonna have to take you in.' WHERE variation = 'Welp, that''s a crime, ${user_mention}. Gonna have to take you in';

INSERT INTO mention_response (mention_text, response) VALUES
	('what the fuck', 'Look, I''m just as confused as you, partner.'),
	('what the fuck', 'Wish I could tell ya.');

INSERT INTO message_variation (message_type, variation) VALUES
	('zerodice', 'I ain''t got nothin'' to work with here.'),
	('zerodice', 'Oh, I see someone''s a jokester.');

INSERT INTO offense (name, sentence, reprimand_chance, is_high_profile) VALUES
	('Obstruction of Highway Passageway', 3, 20, 0);

SELECT * FROM mention_response ORDER BY mention_text;

SELECT * FROM message_variation ORDER BY message_type;

SELECT * FROM offense;

DELETE FROM message_variation WHERE variation = 'That ain''t a person, ya chuckle head.';

DELETE FROM offense WHERE name IN ('Possession', 'Intent to Distribute');