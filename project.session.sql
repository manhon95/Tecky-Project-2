create table "user"(
    id serial primary key,
    user_name varchar(255) not null,
    email varchar(255) not null,
    birthday date not null,
    password varchar(255) not null,
    elo smallint not null
)