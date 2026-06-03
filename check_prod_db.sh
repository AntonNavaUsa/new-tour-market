#!/bin/bash

echo "=== Current tables ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "\dt"

echo "=== accommodation_photos columns ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "\d accommodation_photos"

echo "=== Migration record ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "SELECT migration_name, applied_steps_count, finished_at, logs FROM _prisma_migrations WHERE migration_name LIKE '20260521%';"

echo "=== Migration error logs ==="
docker exec travelio-postgres psql -U travelio -d travelio -c "SELECT logs FROM _prisma_migrations WHERE migration_name = '20260521000001_add_accommodations_guides_calendars';"
