# build user-service image
docker build -f user-service/Dockerfile -t testspectra-user-service .

# build grpc-proxy image
docker build -f grpc-proxy/Dockerfile -t testspectra-grpc-proxy .