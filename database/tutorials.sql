CREATE TABLE tutorials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    description TEXT,
    video_url VARCHAR(500),
    target_role VARCHAR(50)
);