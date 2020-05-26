-- Up

CREATE TABLE Questionnaires (
  id CHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  questions TEXT NOT NULL
);

CREATE TABLE Users (
  id CHAR(21) PRIMARY KEY
);

CREATE TABLE UsersQuestionnaires (
  user_id CHAR(21),
  questionnaire_id CHAR(36),
  FOREIGN KEY (user_id) REFERENCES Users(id),
  FOREIGN KEY (questionnaire_id) REFERENCES Questionnaires(id)
);

CREATE TABLE Responses (
    response TEXT NOT NULL,
    questionnaire_id CHAR(36),
    FOREIGN KEY (questionnaire_id) REFERENCES Questionnaires(id)
);

INSERT INTO Questionnaires (id, name, questions) VALUES
('738c592f-7ea6-4452-9a7a-c07d0a5d5285', 'Example Questionnaire', '[ { "id": "name", "text": "What is your name?", "type": "text" }, { "id": "quest", "text": "What is your quest?", "type": "text" }, { "id": "col", "text": "What is your favourite colour?", "type": "text" }, { "id": "velo", "text": "What is the air-speed velocity of an unladen swallow?", "type": "number" }, { "id": "lord", "text": "Which is the best lord?", "type": "single-select", "options": [ "Lord of the Rings", "Lord of the Flies", "Lord of the Dance", "Lorde" ] }, { "id": "langs", "text": "Which computer languages have you used?", "type": "multi-select", "options": [ "JavaScript", "Java", "C", "Python", "Ook", "LISP" ] } ]'),
('4f4424e9-a151-49e6-8d67-e467d7776290', 'A second Questionnaire', '[ { "id": "name", "text": "What is not your name?", "type": "text" }, { "id": "quest", "text": "What is not your quest?", "type": "text" }, { "id": "col", "text": "What is not your favourite colour?", "type": "text" }, { "id": "velo", "text": "What is not the air-speed velocity of an unladen swallow?", "type": "number" }, { "id": "lord", "text": "Which is not the best lord?", "type": "single-select", "options": [ "Lord of the Rings", "Lord of the Flies", "Lord of the Dance", "Lorde" ] }, { "id": "langs", "text": "Which computer languages have not you used?", "type": "multi-select", "options": [ "JavaScript", "Java", "C", "Python", "Ook", "LISP" ] } ]');

INSERT INTO Users (id) VALUES
('_______________PUBLIC'),
('106927976972072440406');

INSERT INTO UsersQuestionnaires (user_id, questionnaire_id) VALUES
('_______________PUBLIC', '738c592f-7ea6-4452-9a7a-c07d0a5d5285'),
('106927976972072440406', '4f4424e9-a151-49e6-8d67-e467d7776290');

INSERT INTO Responses (response, questionnaire_id) VALUES
('{ "name": "John", "quest": "World Domination", "col": "#FFFFFF", "velo": 42, "lord": "Lorde", "langs": ["Java", "Python"] }', '738c592f-7ea6-4452-9a7a-c07d0a5d5285'),
('{ "name": "NotJohn", "quest": "Not World Domination", "col": "#000000", "velo": 24, "lord": "Lorde", "langs": ["Java", "Python"] }', '4f4424e9-a151-49e6-8d67-e467d7776290');

-- Down

DROP TABLE Questionnaires;
DROP TABLE Users;
DROP TABLE UsersQuestionnaires;
DROP TABLE Responses;