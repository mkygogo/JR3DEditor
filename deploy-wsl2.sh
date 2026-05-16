#!/bin/bash
set -e

echo "=========================================="
echo "  Meteor3D WSL2 Deployment Script"
echo "=========================================="

PROJECT_DIR="$HOME/meteor3d"
WIN_PROJECT="/mnt/g/WebGL/Meteor3DEditor/JR3DEditor"

# ---- 1. Install Redis ----
echo ""
echo "[1/8] Installing Redis..."
if ! command -v redis-server &> /dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq redis-server
    echo "Redis installed."
else
    echo "Redis already installed: $(redis-server --version)"
fi

# ---- 2. Upgrade pnpm ----
echo ""
echo "[2/8] Upgrading pnpm to latest..."
npm install -g pnpm@latest 2>/dev/null || sudo npm install -g pnpm@latest
echo "pnpm version: $(pnpm --version)"

# ---- 3. Copy project ----
echo ""
echo "[3/8] Copying project to WSL2 filesystem..."
if [ -d "$PROJECT_DIR" ]; then
    echo "Project directory already exists, syncing..."
    rsync -a --delete --exclude='node_modules' --exclude='.vite' --exclude='dist' "$WIN_PROJECT/" "$PROJECT_DIR/"
else
    mkdir -p "$PROJECT_DIR"
    rsync -a --exclude='node_modules' --exclude='.vite' --exclude='dist' "$WIN_PROJECT/" "$PROJECT_DIR/"
fi
echo "Project copied to $PROJECT_DIR"

# ---- 4. Configure MongoDB ----
echo ""
echo "[4/8] Configuring MongoDB..."

# Enable auth in mongod.conf if not already
if ! grep -q "^security:" /etc/mongod.conf 2>/dev/null; then
    echo "Enabling MongoDB authentication..."
    sudo sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf
fi

# Start MongoDB
echo "Starting MongoDB..."
sudo mongod --fork --logpath /var/log/mongod.log --dbpath /var/lib/mongodb --bind_ip 127.0.0.1 --port 27017 2>/dev/null || true

# Wait for MongoDB to start
sleep 2

# Create admin user (ignore error if exists)
echo "Creating MongoDB admin user..."
mongosh --quiet admin --eval '
try {
    db.createUser({
        user: "root",
        pwd: "123456",
        roles: [{ role: "root", db: "admin" }]
    });
    print("Admin user created.");
} catch(e) {
    if (e.codeName === "DuplicateKey" || e.message.includes("already exists")) {
        print("Admin user already exists.");
    } else {
        print("Note: " + e.message);
    }
}
' 2>/dev/null || echo "User may already exist, continuing..."

# Restart MongoDB with auth
echo "Restarting MongoDB with auth..."
sudo mongod --shutdown 2>/dev/null || true
sleep 1
sudo mongod --fork --logpath /var/log/mongod.log --dbpath /var/lib/mongodb --bind_ip 127.0.0.1 --port 27017 --auth 2>/dev/null || true
sleep 2

# Verify connection
echo "Verifying MongoDB connection..."
mongosh --quiet "mongodb://root:123456@127.0.0.1:27017/meteor3d?authSource=admin" --eval 'print("MongoDB connection OK: " + db.getName())' 2>/dev/null || echo "Warning: MongoDB auth verification pending, may work after restart"

# ---- 5. Configure Redis ----
echo ""
echo "[5/8] Configuring Redis..."

# Set Redis password
if ! grep -q "^requirepass chenwei" /etc/redis/redis.conf 2>/dev/null; then
    sudo sed -i 's/^# requirepass .*/requirepass chenwei/' /etc/redis/redis.conf 2>/dev/null || true
    # If the line wasn't commented, add it
    if ! grep -q "^requirepass chenwei" /etc/redis/redis.conf 2>/dev/null; then
        echo "requirepass chenwei" | sudo tee -a /etc/redis/redis.conf > /dev/null
    fi
fi

# Start Redis
echo "Starting Redis..."
sudo service redis-server start 2>/dev/null || sudo redis-server /etc/redis/redis.conf --daemonize yes 2>/dev/null || true
sleep 1

# Verify Redis
redis-cli -a chenwei ping 2>/dev/null && echo "Redis connection OK" || echo "Warning: Redis may need manual start"

# ---- 6. Install dependencies ----
echo ""
echo "[6/8] Installing project dependencies..."
cd "$PROJECT_DIR"
pnpm install

# ---- 7. Create .env file ----
echo ""
echo "[7/8] Creating server .env file..."
cat > "$PROJECT_DIR/meteor3d-server/.env" << 'EOF'
PORT=3001
MONGODB_URI=mongodb://root:123456@127.0.0.1:27017/meteor3d
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=chenwei
# Upyun CDN (optional, configure if needed)
# UPYUN_SERVICE=your-service
# UPYUN_OPERATOR=your-operator
# UPYUN_PASSWORD=your-password
# AI Chat (optional)
# OPENAI_API_KEY=your-key
# GOOGLE_AI_KEY=your-key
EOF
echo ".env created."

# ---- 8. Summary ----
echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Project location: $PROJECT_DIR"
echo ""
echo "To start services:"
echo "  # Start MongoDB (if not running):"
echo "  sudo mongod --fork --logpath /var/log/mongod.log --dbpath /var/lib/mongodb --auth --bind_ip 127.0.0.1"
echo ""
echo "  # Start Redis (if not running):"
echo "  sudo service redis-server start"
echo ""
echo "  # Start backend server:"
echo "  cd $PROJECT_DIR/meteor3d-server && npm run dev"
echo ""
echo "  # Start scene editor (new terminal):"
echo "  cd $PROJECT_DIR && pnpm dev:scene"
echo ""
echo "  # Start asset manager (new terminal):"
echo "  cd $PROJECT_DIR && pnpm dev:asset"
echo ""
echo "Access URLs:"
echo "  Scene Editor:   http://localhost:5173"
echo "  Asset Manager:  http://localhost:5175"
echo "  Backend API:    http://localhost:3001"
echo "=========================================="
