-- Up

CREATE TABLE Questionnaires (
  id CHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  visibility BOOLEAN NOT NULL,
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

INSERT INTO Users (id) VALUES
('_______________PUBLIC');

-- Down

DROP TABLE Questionnaires;
DROP TABLE Users;
DROP TABLE UsersQuestionnaires;
DROP TABLE Responses;