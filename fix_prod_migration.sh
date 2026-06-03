#!/bin/bash
set -e

echo "=== Step 1: Check accommodation_photos with NULL accommodation_id ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "SELECT COUNT(*) as null_count FROM accommodation_photos WHERE accommodation_id IS NULL;"

echo "=== Step 2: Delete orphaned accommodation_photos ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "DELETE FROM accommodation_photos WHERE accommodation_id IS NULL;"

echo "=== Step 3: Check tables already created by partial migration ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "\dt"

echo "=== Step 4: Drop partially created tables if they exist ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "
DROP TABLE IF EXISTS guide_blocks CASCADE;
DROP TABLE IF EXISTS accommodation_blocks CASCADE;
DROP TABLE IF EXISTS card_accommodations CASCADE;
DROP TABLE IF EXISTS card_guides CASCADE;
DROP TABLE IF EXISTS accommodations CASCADE;
"

echo "=== Step 5: Remove failed migration record ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "DELETE FROM _prisma_migrations WHERE migration_name = '20260521000001_add_accommodations_guides_calendars';"

echo "=== Step 6: Restart backend to re-run migrations ==="
cd /opt/travelio
docker compose -f docker-compose.prod.yml restart travelio-backend

echo "=== Step 7: Wait 15s for backend to start ==="
sleep 15

echo "=== Step 8: Check backend logs ==="
docker compose -f docker-compose.prod.yml logs travelio-backend --tail=20

echo "=== Done ==="
