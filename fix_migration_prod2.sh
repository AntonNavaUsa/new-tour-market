#!/bin/bash
set -e

echo "=== Step 1: Delete all accommodation_photos (orphaned, can't migrate) ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "DELETE FROM accommodation_photos;"

echo "=== Step 2: Remove failed migration record ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "DELETE FROM _prisma_migrations WHERE migration_name = '20260521000001_add_accommodations_guides_calendars';"

echo "=== Step 3: Verify cleanup ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "SELECT COUNT(*) as photos_count FROM accommodation_photos;"
docker exec travelio-postgres psql -U travelio -d travelio -c "SELECT migration_name FROM _prisma_migrations WHERE migration_name LIKE '20260521%';"

echo "=== Step 4: Restart backend to re-run migration ==="
cd /opt/travelio
docker compose -f docker-compose.prod.yml restart travelio-backend

echo "=== Step 5: Wait 20s ==="
sleep 20

echo "=== Step 6: Check backend logs ==="
docker compose -f docker-compose.prod.yml logs travelio-backend --tail=30

echo "=== Step 7: Verify new tables ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('accommodations','guide_blocks','accommodation_blocks','card_accommodations','card_guides') ORDER BY tablename;"

echo "=== Done ==="
