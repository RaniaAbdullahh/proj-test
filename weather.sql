DROP TABLE IF EXISTS weather;
CREATE TABLE weather(
    id SERIAL  PRIMARY KEY,
     search_query VARCHAR (255),
    time VARCHAR(255),
    forecast VARCHAR(255)
)