1. npm i
2. Make sure there is a mongoDB instance running locally
3. Copy .env.example to .env
4. Setup mongo uri in .env and server port
5. Call api/admin/initdb to populate with random data
6. Feel free to test

Example db with docker:
docker run -d \
 --name mongo-dev \
 -p 27017:27017 \
 -e MONGO_INITDB_ROOT_USERNAME=root \
 -e MONGO_INITDB_ROOT_PASSWORD=example \
 mongo:latest
