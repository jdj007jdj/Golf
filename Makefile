.PHONY: setup dev test deploy clean

setup:
	docker-compose up -d
	make migrate

dev:
	docker-compose up
	npm run dev

test:
	npm run test:unit
	npm run test:integration

deploy:
	# Build Docker images for backend and frontend
	docker build -t Golf-backend:$(shell git rev-parse HEAD || echo "latest") ./backend
	docker build -t Golf-frontend:$(shell git rev-parse HEAD || echo "latest") ./frontend
	# Push images to Docker registry
	# Update Kubernetes deployment

clean:
	docker-compose down -v
	rm -rf node_modules dist

migrate:
	docker-compose exec backend npm run migrate

backup:
	# Create backups directory if it doesn't exist
	mkdir -p backups
	# Dump database
	docker-compose exec postgres pg_dump -U appuser appdb > backups/db_$(shell date +%Y%m%d_%H%M%S).sql
	# Create tar archive of project
	tar -czf backups/app_$(shell date +%Y%m%d_%H%M%S).tar.gz --exclude=node_modules --exclude=.git .