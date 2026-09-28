.PHONY: up down logs test lint seed backup

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

test:
	docker compose run --rm api pytest -q

lint:
	docker compose run --rm api ruff check app tests

seed:
	docker compose exec api python -m app.seed

backup:
	bash scripts/backup.sh

