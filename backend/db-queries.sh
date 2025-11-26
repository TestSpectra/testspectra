#!/bin/bash

# TestSpectra Database Query Helper
# Useful commands to inspect PostgreSQL database

CONTAINER="testspectra-db"
DB_USER="testspectra"
DB_NAME="testspectra"

echo "📊 TestSpectra Database Queries"
echo "================================"
echo ""

# Function to run query
run_query() {
    docker exec -it $CONTAINER psql -U $DB_USER -d $DB_NAME -c "$1"
}

# Check if running
if ! docker ps | grep -q $CONTAINER; then
    echo "❌ Container '$CONTAINER' is not running"
    echo "Start it with: docker start $CONTAINER"
    exit 1
fi

echo "✅ Connected to: $CONTAINER"
echo ""

case "${1:-help}" in
    users)
        echo "📋 All Users:"
        run_query "SELECT id, name, email, role, status, joined_date FROM users ORDER BY joined_date;"
        ;;
    
    admin)
        echo "👑 Admin Users:"
        run_query "SELECT name, email, status FROM users WHERE role = 'admin';"
        ;;
    
    permissions)
        echo "🔐 Users with Special Permissions:"
        run_query "
            SELECT u.name, u.email, u.role, 
                   COALESCE(ARRAY_AGG(p.permission), '{}') as special_permissions
            FROM users u
            LEFT JOIN user_special_permissions p ON u.id = p.user_id
            GROUP BY u.id, u.name, u.email, u.role
            ORDER BY u.name;
        "
        ;;
    
    count)
        echo "📈 User Statistics:"
        run_query "
            SELECT role, COUNT(*) as count, 
                   SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
            FROM users 
            GROUP BY role 
            ORDER BY count DESC;
        "
        ;;
    
    tables)
        echo "📑 All Tables:"
        run_query "\dt"
        ;;
    
    schema)
        echo "🗂️  Users Table Schema:"
        run_query "\d users"
        ;;
    
    recent)
        echo "🕐 Recently Active Users:"
        run_query "SELECT name, email, last_active FROM users ORDER BY last_active DESC LIMIT 10;"
        ;;
    
    search)
        if [ -z "$2" ]; then
            echo "Usage: $0 search <email_or_name>"
            exit 1
        fi
        echo "🔍 Searching for: $2"
        run_query "SELECT * FROM users WHERE email ILIKE '%$2%' OR name ILIKE '%$2%';"
        ;;
    
    interactive)
        echo "🖥️  Opening interactive psql session..."
        echo "Type '\q' to exit"
        echo ""
        docker exec -it $CONTAINER psql -U $DB_USER -d $DB_NAME
        ;;
    
    help|*)
        echo "Available commands:"
        echo ""
        echo "  ./db-queries.sh users         - List all users"
        echo "  ./db-queries.sh admin         - Show admin users"
        echo "  ./db-queries.sh permissions   - Show special permissions"
        echo "  ./db-queries.sh count         - User statistics by role"
        echo "  ./db-queries.sh tables        - List all tables"
        echo "  ./db-queries.sh schema        - Show users table schema"
        echo "  ./db-queries.sh recent        - Recently active users"
        echo "  ./db-queries.sh search <term> - Search users"
        echo "  ./db-queries.sh interactive   - Open psql session"
        echo ""
        echo "Examples:"
        echo "  ./db-queries.sh users"
        echo "  ./db-queries.sh search admin"
        echo "  ./db-queries.sh interactive"
        ;;
esac
