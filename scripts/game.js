const fpsCounter = document.getElementById("fpsCounter");
const canvas = document.querySelector("canvas");
const scoreCounter = document.getElementById("scoreCounter");
const killCounter = document.getElementById("killCounter");
const startButton = document.getElementById("startButton");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.imageSmoothingEnabled = false

let prevTime = Date.now(),
    dtm = 15, //delta time in milliseconds
    dts = 0, //delta time in seconds
    fps = 60, //Frames per second
    player = null,
    keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        any: false,
    },
    mouse = {
        x: 0,
        y: 0,
        down: false,
    },
    tiles = [],
    cols = 100,
    rows = 100,
    camera = {
        position: {
            x: 0,
            y: 0
        },
        smoothness: 5,
        zoom: 27
    },
    RENDER_DISTANCE = Math.max(innerWidth, innerHeight) - 500,
    rockTextures = [new Image(), new Image(), new Image(), new Image()],
    bedrockImage = new Image(),
    grassImages = [new Image(), new Image(), new Image(), new Image(), new Image()],
    bulletImage = new Image(),
    rubbleImage = new Image(),
    deadrockImage = new Image(),
    goldImage = new Image(),
    diamondImage = new Image(),
    borderImage = new Image(),
    redrockImage = new Image(),
    emeraldImage = new Image(),
    deadHullImage = new Image(),
    deadTurretImage = new Image(),
    fireParticleImage = new Image(),
    lightParticleImage = new Image(),
    medParticleImage = new Image(),
    darkParticleImage = new Image(),
    blueParticleImage = new Image(),
    redParticleImage = new Image(),
    lushGrassImage = new Image(),
    dirtImage = new Image(),
    bumpSound = new Audio("./sounds/Bump.wav"),
    enemyDeathSounds = [new Audio("./sounds/EnemyDeath.wav"), new Audio("./sounds/EnemyDeath2.wav")],
    enemyShootSound = new Audio("./sounds/EnemyShoot.wav"),
    hitSound = new Audio("./sounds/Hit.wav"),
    playerDeathSound = new Audio("./sounds/PlayerDeath.wav"),
    playerShootSounds = [new Audio("./sounds/PlayerShoot.wav"), new Audio("./sounds/PlayerShoot2.wav")],
    mineSound = new Audio("./sounds/Mining/Mine.wav"),
    oreBreakSounds = [new Audio("./sounds/Mining/Ore1.wav"), new Audio("./sounds/Mining/Ore2.wav"), new Audio("./sounds/Mining/Ore3.wav")],
    stoneBreakSounds = [new Audio("./sounds/Mining/Stone Broken1.wav"), new Audio("./sounds/Mining/Stone Broken2.wav"), new Audio("./sounds/Mining/Stone Broken3.wav")],
    particles = [],
    particleImages = [fireParticleImage, lightParticleImage, medParticleImage, darkParticleImage],
    enemies = [],
    score = 0,
    kills = 0;

rockTextures[0].src = "./assets/Rock.png";
rockTextures[0].id = "rock";
rockTextures[1].src = "./assets/Rock2.png";
rockTextures[1].id = "rock";
rockTextures[2].src = "./assets/Rock3.png";
rockTextures[2].id = "rock";
rockTextures[3].src = "./assets/Rock4.png";
rockTextures[3].id = "rock";
bedrockImage.src = "./assets/Bedrock.png";
bedrockImage.id = "bedrock";
grassImages[0].src = "./assets/Grass.png";
grassImages[1].src = "./assets/Grass1.png";
grassImages[2].src = "./assets/Grass2.png";
grassImages[3].src = "./assets/Grass3.png";
grassImages[4].src = "./assets/Grass4.png";
bulletImage.src = "./assets/Shell.png";
rubbleImage.src = "./assets/Rubble.png";
deadrockImage.src = "./assets/Deadrock.png";
goldImage.src = "./assets/Gold.png";
goldImage.id = "gold";
diamondImage.src = "./assets/Shiny.png";
diamondImage.id = "diamond";
borderImage.src = "./assets/Border.png";
borderImage.id = "border";
redrockImage.src = "./assets/Crimson.png";
redrockImage.id = "redstone";
emeraldImage.src = "./assets/Emerald.png";
emeraldImage.id = "emerald";
deadHullImage.src = "./assets/DeadHull.png";
deadTurretImage.src = "./assets/DeadTurret.png";
fireParticleImage.src = "./assets/FirePart.png";
lightParticleImage.src = "./assets/LightPart.png";
medParticleImage.src = "./assets/MedPart.png";
darkParticleImage.src = "./assets/DarkPart.png";
blueParticleImage.src = "./assets/BluePart.png";
redParticleImage.src = "./assets/RedPart.png";
dirtImage.src = "./assets/Dirt.png";
lushGrassImage.src = "./assets/Lush.png";

class Particle {
    constructor(x, y, w, h, a, image, force, friction, lifeTime) {
        this.position = {
            x,
            y
        };
        this.width = w;
        this.height = h;
        this.angle = a;
        this.image = image;
        this.velocity = {
            x: Math.cos(a) * force,
            y: Math.sin(a) * force
        };
        this.friction = friction;
        this.rotationV = Math.random() - 0.5;
        this.rotationV *= 0.2;
        this.lifeTime = lifeTime;
        this.dead = false;
        this.radius = (w + h) / 4;
    }
    draw() {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle)

        //draw image
        ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }
    update(dts) {
        if (this.dead) return;
        this.draw();
        this.angle += this.rotationV * dts * 1000;

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        this.lifeTime -= dts;
        if (this.lifeTime < 0) this.dead = true;
    }
}
class Player {
    constructor(x, y, w, h) {
        this.position = {
            x,
            y
        };
        this.width = w;
        this.height = h;
        this.radius = (this.width + this.height) / 4;
        this.velocity = {
            x: 0,
            y: 0
        };
        this.speed = 500;
        this.turretSpeed = 0.01;
        this.hullAngle = 0;
        this.friction = 0.8;
        this.image = new Image();
        this.image.src = "./assets/Hull.png";
        this.frameWidth = 17;
        this.frameHeight = 15;
        this.framesY = 3;
        this.framesX = 1;
        this.frameY = 0;
        this.animationDelay = 0;
        this.animationRate = 0.002;
        this.steer = 0;
        this.steerSpeed = 0.01;
        this.turretAngle = 0;
        this.turretDirection = {
            x: 1,
            y: 0
        };
        this.turretImage = new Image();
        this.turretImage.src = "./assets/Turret.png";
        this.bullets = [];
        this.bulletDelay = 0;
        this.bulletRate = 0.1;//0.1;
        this.cannonRecoil = 0;
        this.cannonFirstRecoil = 10;
        this.cannonSmoothRecoil = 0.9;
        this.hullRecoilForce = -1000;
        this.health = 100;
        this.maxHealth = this.health;
        this.healthBarWidth = window.innerWidth / 2;
        this.healthBarHeight = 20;
        this.dead = false;
        this.smoothHealth = this.health;
        this.prevDead = false;
        this.burnParticleDelay = 0;
        this.burnParticleRate = 0.01;
        this.fireAngleOffset = Math.random() * Math.PI * 2
        this.fireOffset = {
            x: Math.cos(this.fireAngleOffset) * this.radius * Math.random(),
            y: Math.sin(this.fireAngleOffset) * this.radius * Math.random()
        };
        this.fireAmount = 100;
        this.fireCount = 0;
        this.deadRate = 1;
        this.deadDelay = this.deadRate;
    }
    draw() {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.hullAngle)
        // ctx.fillStyle = "white";
        // ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        //draw image
        ctx.drawImage(this.image, 0, (this.frameY % this.framesY) * this.frameHeight, this.frameWidth, this.frameHeight, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();

        //draw turret
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.turretAngle);
        ctx.translate(8.5, 0);

        ctx.drawImage(this.turretImage, -this.width / 2 - this.cannonRecoil, -this.height / 2, this.width, this.height);
        this.cannonRecoil *= this.cannonSmoothRecoil;

        ctx.restore();
    }
    update(dts) {
        if (this.dead) {
            this.image = deadHullImage;
            this.turretImage = deadTurretImage;
            this.framesY = 1;
        }

        this.bullets.forEach((b) => {
            b.update(dts);
        })

        this.draw();

        let mx = mouse.x - canvas.width / 2;
        let my = mouse.y - canvas.height / 2;
        // let m = normalize({ x: mx, y: my });
        // m.x *= 1;
        // m.y *= 1;
        // this.turretDirection.x = lerp(this.turretDirection.x, -m.x, this.turretSpeed);
        // this.turretDirection.y = lerp(this.turretDirection.y, -m.y, this.turretSpeed);

        this.position.x += this.velocity.x * dts;
        this.position.y += this.velocity.y * dts;
        this.velocity.y *= this.friction;
        this.velocity.x *= this.friction;

        if (this.dead && !this.prevDead) {
            for (let i = 0; i < Math.PI * 2; i += 0.1) {
                particles.push(new Particle(this.position.x, this.position.y, 15, 15, i, fireParticleImage, Math.random() * 10, 0.98, 0.1));
            }
        }

        if (this.dead) {
            this.deadDelay -= dts;
            this.burnParticleDelay -= dts;
            if (this.burnParticleDelay < 0 && this.fireCount < this.fireAmount) {
                this.fireCount++;
                this.burnParticleDelay = this.burnParticleRate;
                particles.push(new Particle(this.position.x + this.fireOffset.x, this.position.y + this.fireOffset.y, 7, 7, Math.random() * Math.PI * 2, fireParticleImage, Math.random(), 0.9, 0.1));
            }

            startButton.parentElement.style.opacity = "0";
            setTimeout(function () {
                startButton.parentElement.style.opacity = "1";
                startButton.parentElement.style.visibility = "visible";
            }, 1000);

            this.prevDead = true;
            return;
        }

        this.turretAngle = Math.atan2(my, mx);

        if (keys.up) {
            this.hullAngle += this.steer * dts * getMag(this.velocity);
            this.velocity.y += Math.sin(this.hullAngle) * this.speed;
            this.velocity.x += Math.cos(this.hullAngle) * this.speed;
        }
        if (keys.down) {
            this.hullAngle -= this.steer * dts * getMag(this.velocity);
            this.velocity.y -= Math.sin(this.hullAngle) * this.speed;
            this.velocity.x -= Math.cos(this.hullAngle) * this.speed;
        }
        this.steer = 0;
        if (keys.left) {
            this.steer = -this.steerSpeed
        }
        if (keys.right) {
            this.steer = this.steerSpeed;
        }
        this.animationDelay -= dts;
        if (keys.any && this.animationDelay < 0) {
            this.animationDelay = this.animationRate;
            this.frameY++;
        }
        this.bulletDelay -= dts;
        if (mouse.down && this.bulletDelay < 0) {
            playerShootSounds[Math.floor(Math.random() * playerShootSounds.length)].play();
            this.cannonRecoil = this.cannonFirstRecoil;
            this.bulletDelay = this.bulletRate;
            this.bullets.push(new Bullet(this.position.x + Math.cos(this.turretAngle) * (this.width - 10), this.position.y + Math.sin(this.turretAngle) * (this.width - 10), 10, 5, this.turretAngle));
            this.velocity.x += Math.cos(this.turretAngle) * this.hullRecoilForce;
            this.velocity.y += Math.sin(this.turretAngle) * this.hullRecoilForce;
        }

        enemies.forEach((enemy) => {
            enemy.bullets.forEach((bullet) => {
                let dx = bullet.position.x - this.position.x;
                let dy = bullet.position.y - this.position.y;
                let d = Math.sqrt(dx * dx + dy * dy);
                if (d < this.radius + bullet.radius && !bullet.dead) {
                    hitSound.play();
                    this.velocity.x += Math.cos(bullet.angle) * -this.hullRecoilForce;
                    this.velocity.y += Math.sin(bullet.angle) * -this.hullRecoilForce;
                    this.health = (this.health < 0) ? 0 : this.health - bullet.power;

                    for (let i = Math.PI / 6; i < Math.PI - Math.PI / 6; i += 0.1) {
                        particles.push(new Particle(bullet.position.x, bullet.position.y, 5, 5, (bullet.angle + i) + Math.PI / 2, redParticleImage, Math.random() * 7, 0.9, 0.1 + Math.random() * 0.05));
                    }

                    bullet.dead = true;
                    if (this.health <= 0) {
                        this.dead = true;
                        playerDeathSound.play();
                    }
                }
            })
        })

    }
}
class Tile {
    constructor(x, y, w, h, options) {
        this.position = {
            x,
            y
        };
        this.width = w;
        this.height = h;
        this.lines = [
            new Line(x, y, x, y + h), //left side
            new Line(x, y + h, x + w, y + h), //bottom side
            new Line(x + w, y + h, x + w, y), //right side
            new Line(x + w, y, x, y), //top side
        ];
        if (options.solid == false) this.lines = [];
        this.rockTextureIndex = Math.floor(Math.random() * rockTextures.length);
        this.solid = options.solid;
        this.image = (options.image) ? options.image : rockTextures[this.rockTextureIndex];
        this.dead = false;
        this.health = 50;
    }
    draw() {
        ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);

        this.lines.forEach((line) => {
            line.collide(player);

            player.bullets.forEach((bullet, i) => {
                if (bullet.dead) player.bullets.splice(i, 1);
                if (line.collideBullet(bullet)) {
                    if (this.image.id != "border") {
                        this.health -= bullet.power;
                    }
                    if (this.image.id == "rock") {
                      this.health = 0;
                    }
                    if (this.health > 0 && this.image.id != "bedrock" && this.image.id != "rock") mineSound.play();
                    else if (this.health > 0) stoneBreakSounds[Math.floor(Math.random() * stoneBreakSounds.length)].play();
                    player.bullets.splice(i, 1);
                }
            })
            enemies.forEach((enemy) => {
                line.collide(enemy);

                enemy.bullets.forEach((bullet, i) => {
                    if (bullet.dead) enemy.bullets.splice(i, 1);
                    if (line.collideBullet(bullet)) {
                        if (this.image.id != "border") {
                            this.health -= bullet.power;
                        }
                        if (this.image.id == "rock") {
                           this.health = 0;
                        }
                        if (this.health > 0 && this.image.id != "bedrock" && this.image.id != "rock") mineSound.play();
                        else if (this.health > 0) stoneBreakSounds[Math.floor(Math.random() * stoneBreakSounds.length)].play();
                        enemy.bullets.splice(i, 1);
                    }
                })
            })
        })

        if (this.health <= 0 && this.solid) {
            this.lines = [];
            this.solid = false;
            if (this.image.id == "bedrock" || this.image.id == "rock") {
                stoneBreakSounds[Math.floor(Math.random() * stoneBreakSounds.length)].play();
                score += 5;
            }
            if (this.image.id == "gold" || this.image.id == "redstone" || this.image.id == "diamond" || this.image.id == "emerald") {
                oreBreakSounds[Math.floor(Math.random() * oreBreakSounds.length)].play();
            }
            if (this.image.id == "gold") score += 50;
            if (this.image.id == "redstone") {
                score += 50;
                player.health += 7.5;
                if (player.health > player.maxHealth) player.health = player.maxHealth;
            }
            if (this.image.id == "diamond") score += 75;
            if (this.image.id == "emerald") score += 100;
            this.image = (this.image.id == "bedrock") ? deadrockImage : rubbleImage;
            for (let i = 0; i < 50; i++) {
                particles.push(new Particle(this.position.x + Math.random() * this.width - 5, this.position.y + Math.random() * this.height - 5, 10, 10, Math.random() * Math.PI * 2, (Math.round(Math.random() + 0.3) == 0) ? lightParticleImage : (Math.round(Math.random()) == 0) ? darkParticleImage : medParticleImage, Math.random() * 10, 0.3 + Math.random() * 0.1, 0.1 + Math.random() * 0.03));
                particles[particles.length - 1].rotationV = 0;
                particles[particles.length - 1].angle *= 0.1;
            }
        }

    }
}
class Bullet {
    constructor(x, y, w, h, a) {
        this.position = {
            x,
            y
        };
        this.speed = 10;
        this.angle = a;
        this.velocity = {
            x: Math.cos(this.angle) * this.speed,
            y: Math.sin(this.angle) * this.speed,
        };
        this.width = w;
        this.height = h;
        this.radius = (w + h) / 4;
        this.dead = false;
        this.lifeTime = 1;
        this.power = 25;
        this.particleDelay = 0;
        this.particleRate = 0.0025;
    }
    draw() {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);
        ctx.drawImage(bulletImage, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }
    update(dts) {
        this.draw();

        this.position.x += this.velocity.x * dts * 500;
        this.position.y += this.velocity.y * dts * 500;
        this.lifeTime -= dts;
        if (this.lifeTime < 0) this.dead = true;

        this.particleDelay -= dts;
        if (this.particleDelay < 0) {
            this.particleDelay = this.particleRate;
            particles.push(new Particle(this.position.x, this.position.y, 3, 3, this.angle + Math.random(), lightParticleImage, 2, 0.9, 0.05 + Math.random() * 0.05));
        }
    }
}
class Line {
    constructor(x1, y1, x2, y2) {
        this.a = {
            x: x1,
            y: y1
        };
        this.b = {
            x: x2,
            y: y2
        };
        this.width = 5;
        this.center = {
            x: (this.a.x + this.b.x) / 2,
            y: (this.a.y + this.b.y) / 2
        }
    }
    collide(circle) {
        const collision = lineCircle(this, circle);
        if (collision) {
            const dx = circle.position.x - collision.closestX;
            const dy = circle.position.y - collision.closestY;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d != 0) {
                const normal = { x: dx / d, y: dy / d };
                const depth = (this.width + circle.radius) - d;
                circle.position.x += normal.x * depth;
                circle.position.y += normal.y * depth;
                circle.velocity.x += normal.x * depth;
                circle.velocity.y += normal.y * depth;
            }
        }
    }
    collideBullet(bullet) {
        const collision = lineCircle(this, bullet);
        if (collision) {
            for (let i = Math.PI / 6; i < Math.PI - Math.PI / 6; i += 0.1) {
                particles.push(new Particle(bullet.position.x, bullet.position.y, 5, 5, (bullet.angle + i) + Math.PI / 2, (Math.round(Math.random()) == 0) ? darkParticleImage : lightParticleImage, Math.random() * 7, 0.9, 0.1 + Math.random() * 0.05));
            }
            return true;
        }
        return false;
    }
}
class Enemy {
    constructor(x, y, w, h) {
        this.position = {
            x,
            y
        };
        this.velocity = {
            x: 0,
            y: 0
        };
        this.width = w;
        this.height = h;
        this.hullAngle = 0;
        this.turretAngle = 0;
        this.speed = 250;
        this.turnSpeed = 0.05;
        this.hullImage = new Image();
        this.turretImage = new Image();
        this.hullImage.src = "./assets/BlueHull.png";
        this.turretImage.src = "./assets/BlueGun.png";
        this.friction = 0.8;
        this.frameY = 0;
        this.framesY = 3;
        this.frameHeight = 15;
        this.frameWidth = 17;
        this.cannonRecoil = 0;
        this.cannonFirstRecoil = 10;
        this.cannonSmoothRecoil = 0.9;
        this.bullets = [];
        this.shootDelay = 0;
        this.shootRate = 0.1;
        this.hullRecoilForce = -1000;
        this.radius = (this.width + this.height) / 4;
        this.viewRadius = 400;
        this.steer = 0;
        this.steerSpeed = 10;
        this.shootDistance = 150;
        this.target = { x: 0, y: 0 };
        this.wanderRate = 0.1;
        this.wanderDelay = 0;
        this.health = 100;
        this.id = Math.random() * 1000;
        this.prevDead = false;
        this.burnParticleDelay = 0;
        this.burnParticleRate = 0.01;
        this.fireAngleOffset = Math.random() * Math.PI * 2
        this.fireOffset = {
            x: Math.cos(this.fireAngleOffset) * this.radius * Math.random(),
            y: Math.sin(this.fireAngleOffset) * this.radius * Math.random()
        };
        this.fireAmount = 100;
        this.fireCount = 0;
    }
    draw() {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.hullAngle)
        // ctx.fillStyle = "white";
        // ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        //draw image
        ctx.drawImage(this.hullImage, 0, (this.frameY % this.framesY) * this.frameHeight, this.frameWidth, this.frameHeight, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();

        //draw turret
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.turretAngle);
        ctx.translate(8.5, 0);

        ctx.drawImage(this.turretImage, -this.width / 2 - this.cannonRecoil, -this.height / 2, this.width, this.height);
        this.cannonRecoil *= this.cannonSmoothRecoil;

        ctx.restore();
    };
    update(dts) {
        if (this.dead) {
            this.hullImage = deadHullImage;
            this.turretImage = deadTurretImage;
            this.framesY = 1;
            this.bullets = [];
        }

        this.draw();

        this.position.x += this.velocity.x * dts;
        this.position.y += this.velocity.y * dts;
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        player.bullets.forEach((bullet) => {
            let dx = bullet.position.x - this.position.x;
            let dy = bullet.position.y - this.position.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            if (d < this.radius + bullet.radius && !bullet.dead) {
                this.velocity.x += Math.cos(bullet.angle) * -this.hullRecoilForce;
                this.velocity.y += Math.sin(bullet.angle) * -this.hullRecoilForce;
                if (!this.dead) enemyDeathSounds[Math.floor(Math.random() * enemyDeathSounds.length)].play();
                else hitSound.play();

                if (this.dead) {
                    for (let i = Math.PI / 6; i < Math.PI - Math.PI / 6; i += 0.1) {
                        particles.push(new Particle(bullet.position.x, bullet.position.y, 5, 5, (bullet.angle + i) + Math.PI / 2, (Math.round(Math.random()) == 0) ? darkParticleImage : lightParticleImage, Math.random() * 7, 0.9, 0.1 + Math.random() * 0.05));
                    }
                } else {
                    for (let i = Math.PI / 6; i < Math.PI - Math.PI / 6; i += 0.1) {
                        particles.push(new Particle(bullet.position.x, bullet.position.y, 5, 5, (bullet.angle + i) + Math.PI / 2, blueParticleImage, Math.random() * 7, 0.9, 0.1 + Math.random() * 0.05));
                    }
                }

                this.dead = true;
                bullet.dead = true;
            }
        })
        enemies.forEach((enemy) => {
            if (enemy.id != this.id) {
                enemy.bullets.forEach((bullet) => {
                    let dx = bullet.position.x - this.position.x;
                    let dy = bullet.position.y - this.position.y;
                    let d = Math.sqrt(dx * dx + dy * dy);
                    if (d < this.radius + bullet.radius && !bullet.dead) {
                        this.velocity.x += Math.cos(bullet.angle) * -this.hullRecoilForce;
                        this.velocity.y += Math.sin(bullet.angle) * -this.hullRecoilForce;
                        if (!this.dead) enemyDeathSounds[Math.floor(Math.random() * enemyDeathSounds.length)].play();
                        else hitSound.play();

                        if (this.dead) {
                            for (let i = Math.PI / 6; i < Math.PI - Math.PI / 6; i += 0.1) {
                                particles.push(new Particle(bullet.position.x, bullet.position.y, 5, 5, (bullet.angle + i) + Math.PI / 2, (Math.round(Math.random()) == 0) ? darkParticleImage : lightParticleImage, Math.random() * 7, 0.9, 0.1 + Math.random() * 0.05));
                            }
                        } else {
                            for (let i = Math.PI / 6; i < Math.PI - Math.PI / 6; i += 0.1) {
                                particles.push(new Particle(bullet.position.x, bullet.position.y, 5, 5, (bullet.angle + i) + Math.PI / 2, blueParticleImage, Math.random() * 7, 0.9, 0.1 + Math.random() * 0.05));
                            }
                        }

                        this.dead = true;
                        bullet.dead = true;
                    }
                })
            }
        })

        if (this.dead && !this.prevDead) {
            player.health += 10;
            if (player.health > player.maxHealth) player.health = player.maxHealth;
            kills++;
            score += 50;
            for (let i = 0; i < Math.PI * 2; i += 0.1) {
                particles.push(new Particle(this.position.x, this.position.y, 15, 15, i, fireParticleImage, Math.random() * 10, 0.98, 0.1 + (Math.random() - 0.5) * 0.06));
            }
        }

        if (this.dead) {
            this.burnParticleDelay -= dts;
            if (this.burnParticleDelay < 0 && this.fireCount < this.fireAmount) {
                this.fireCount++;
                this.burnParticleDelay = this.burnParticleRate;
                particles.push(new Particle(this.position.x + this.fireOffset.x, this.position.y + this.fireOffset.y, 7, 7, Math.random() * Math.PI * 2, fireParticleImage, Math.random(), 0.9, 0.1));
            }

            this.prevDead = true;
            return;
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(dts);
        }

        let dx = player.position.x - this.position.x;
        let dy = player.position.y - this.position.y;
        let d = Math.sqrt(dx * dx + dy * dy);

        if (d > this.shootDistance && d < this.viewRadius && !player.dead) {
            this.velocity.x += Math.cos(this.hullAngle) * this.speed;
            this.velocity.y += Math.sin(this.hullAngle) * this.speed;
            this.hullAngle = lerp(this.hullAngle, this.turretAngle, this.turnSpeed);
        }

        this.wanderDelay -= dts
        if (d > this.viewRadius || player.dead) {
            if (this.wanderDelay < 0) {
                this.wanderDelay = this.wanderRate;
                let rangle = this.hullAngle - (Math.random() * (Math.PI * 2));
                this.target = {
                    x: this.position.x + Math.cos(rangle) * 100,
                    y: this.position.y + Math.sin(rangle) * 100
                };
            }
        }
        if (d > this.viewRadius || player.dead) {
            let tx = this.target.x - this.position.x;
            let ty = this.target.y - this.position.y;
            let angle = Math.atan2(ty, tx);

            this.hullAngle = lerp(this.hullAngle, angle, this.turnSpeed);
            this.turretAngle = lerp(this.turretAngle, angle, 0.03);

            this.velocity.x += Math.cos(this.hullAngle) * this.speed / 2;
            this.velocity.y += Math.sin(this.hullAngle) * this.speed / 2;
        } else {
            this.turretAngle = Math.atan2(dy, dx);
        }

        this.shootDelay -= dts;
        if (this.shootDelay < 0 && d < this.viewRadius && !player.dead) {
            this.shoot();
        }

        if (Math.floor(this.velocity.x) != 0 || Math.floor(this.velocity.y) != 0) {
            this.frameY++;
        }

    }
    shoot() {
        enemyShootSound.play();
        this.cannonRecoil = this.cannonFirstRecoil;
        this.shootDelay = this.shootRate;
        this.bullets.push(new Bullet(this.position.x + Math.cos(this.turretAngle) * (this.width - 10), this.position.y + Math.sin(this.turretAngle) * (this.width - 10), 10, 5, this.turretAngle));
        this.velocity.x += Math.cos(this.turretAngle) * this.hullRecoilForce;
        this.velocity.y += Math.sin(this.turretAngle) * this.hullRecoilForce;
    }
}

function init() {
    player = new Player(canvas.width / 2, canvas.height / 2, 34, 30);
    enemies = [];
    tiles = [];
    particles = [];
    score = 0;
    let scale = 50;

    for (let col = -cols / 2; col < cols / 2; col++) {
        for (let row = -rows / 2; row < rows / 2; row++) {
            const n = noise(col * 0.1 + cols * 2, row * 0.1 + rows * 2);
            let options = {
                image: dirtImage,
                solid: false
            };
            if (n > 0.5) {
                options.solid = true;
                options.image = rockTextures[Math.floor(Math.random() * rockTextures.length)];
                if (n > 0.6) options.image = bedrockImage;
                if (Math.round(Math.random() + 0.48) == 0) options.image = goldImage;
                if (Math.round(Math.random() + 0.48) == 0) options.image = diamondImage;
                if (Math.round(Math.random() + 0.48) == 0) options.image = redrockImage;
                if (Math.round(Math.random() + 0.48) == 0) options.image = emeraldImage;
            } else if (n > 0.37) {
                options.image = grassImages[Math.floor(Math.random() * grassImages.length)];
            } else if (n > 0.35) {
                options.image = lushGrassImage;
            }
            if (row == -rows / 2 || col == -cols / 2 || row == rows / 2 - 1 || col == cols / 2 - 1) {
                options.solid = true;
                options.image = borderImage;
            }
            if (options.solid == false) {
                if (Math.round(Math.random() + 0.489) == 0) {
                    enemies.push(new Enemy(col * scale, row * scale, 34, 30));
                }
            }
            tiles.push(new Tile(col * scale, row * scale, scale+1, scale+1, options));
        }
    }
}
let touchSound = true;
function loop() {
    // ctx.translate(0, 0);
    // ctx.restore();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.scale(camera.zoom / player.radius, camera.zoom / player.radius);
    ctx.translate(-camera.position.x, -camera.position.y);

    camera.position.x += (player.position.x - camera.position.x) / camera.smoothness;
    camera.position.y += (player.position.y - camera.position.y) / camera.smoothness;

    calculateFPS();

    tiles.forEach((tile) => {
        let dx = player.position.x - tile.position.x;
        let dy = player.position.y - tile.position.y;
        let d = Math.sqrt(dx*dx + dy*dy);
        if (
          d < RENDER_DISTANCE
        ) tile.draw();

        if (tile.solid && true == false) {
            for (let i = particles.length - 1; i >= 0; i--) {
                let particle = particles[i];
                let px = particle.position.x - tile.position.x;
                let py = particle.position.y - tile.position.y;
                let p = Math.sqrt(px * px + py * py);
                if (p < (particle.width + particle.height) / 4 + (tile.width + tile.height) / 4) {
                    particles.splice(i, 1);
                }
            }
        }
    })

    for (let i = tiles.length - 1; i >= 0; i--) {
        if (tiles[i].dead) tiles.splice(i, 1);
    }


    player.update(dts);

    touchSound = false;

    enemies.forEach((enemy) => {

        let dx = player.position.x - enemy.position.x;
        let dy = player.position.y - enemy.position.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d < RENDER_DISTANCE) {
            let radii = player.radius + enemy.radius;

            enemy.update(dts);

            if (d != 0 && d < radii) {
                let depth = (radii - d) / 2;
                let normal = {
                    x: dx / d,
                    y: dy / d
                };
                player.position.x += depth * normal.x;
                player.position.y += depth * normal.y;
                enemy.position.x += depth * -normal.x;
                enemy.position.y += depth * -normal.y;
                player.velocity.x += depth * 5 * normal.x;
                player.velocity.y += depth * 5 * normal.y;
                enemy.velocity.x += depth * 5 * -normal.x;
                enemy.velocity.y += depth * 5 * -normal.y;
                if (touchSound) bumpSound.play();
                touchSound = false;
            }
        }
    });

    for (let i = particles.length - 1; i >= 0; i--) {
        let particle = particles[i];
        particle.update(dts);
        if (particle.dead) particles.splice(i, 1);
    }

    for (let i = 0; i < enemies.length - 1; i++) {
        let a = enemies[i];
        for (let j = i + 1; j < enemies.length; j++) {
            let b = enemies[j];

            let dx = a.position.x - b.position.x;
            let dy = a.position.y - b.position.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            let radii = a.radius + b.radius;

            if (d != 0 && d < radii) {
                let depth = (radii - d) / 2;
                let normal = {
                    x: dx / d,
                    y: dy / d
                };
                a.position.x += depth * normal.x;
                a.position.y += depth * normal.y;
                b.position.x += depth * -normal.x;
                b.position.y += depth * -normal.y;
            }
        }
    }

    ctx.restore();
    drawUI();

    scoreCounter.innerText = "Score: " + score;
    killCounter.innerText = "Kills: " + kills + "/" + enemies.length;

    if (player.deadDelay >= 0) requestAnimationFrame(loop);
}
startButton.onclick = function () {
    startButton.parentElement.style.opacity = "0";
    setTimeout(function () {
        startButton.parentElement.style.visibility = "hidden";
        startGame();
    }, 1000);
}
function startGame() {
    init();
    loop();
}
function drawUI() {
    //draw player healthbar
    player.smoothHealth = lerp(player.smoothHealth, player.health, 0.1);
    ctx.fillStyle = "red";
    ctx.fillRect(0, canvas.height - player.healthBarHeight, player.healthBarWidth, player.healthBarHeight);
    ctx.fillStyle = "green";
    ctx.fillRect(0, canvas.height - player.healthBarHeight, (player.smoothHealth / player.maxHealth) * player.healthBarWidth, player.healthBarHeight);
}
function calculateFPS() {
    dtm = Date.now() - prevTime;
    prevTime = Date.now();
    fps = Math.floor(1000 / dtm);
    dts = dtm * 0.0001;
    fpsCounter.innerText = "FPS: " + fps;
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
window.onmousemove = function (e) {
    mouse.x = e.x;
    mouse.y = e.y;
};
window.onmousedown = function () {
    mouse.down = true;
};
window.onmouseup = function () {
    mouse.down = false;
};
window.onkeydown = function (e) {
    switch (e.key.toLowerCase()) {
        case "w":
            keys.up = true;
            break;
        case "s":
            keys.down = true;
            break;
        case "a":
            keys.left = true;
            break;
        case "d":
            keys.right = true;
            break;
        case "p":
            alert(camera.zoom);
            break;
    }
    keys.any = (keys.up || keys.down) ? true : false;
}
window.onkeyup = function (e) {
    switch (e.key.toLowerCase()) {
        case "w":
            keys.up = false;
            break;
        case "s":
            keys.down = false;
            break;
        case "a":
            keys.left = false;
            break;
        case "d":
            keys.right = false;
            break;
    }
    keys.any = (keys.up || keys.down) ? true : false;
}
document.addEventListener('wheel', function (event) {
    // Get the distance that the mouse wheel was rotated
    const delta = event.deltaY;

    if (delta > 0 && camera.zoom > 15) {
        // The wheel was rotated upwards or away from the user
        camera.zoom--;
    }
    if (delta < 0 && camera.zoom < 60) {
        // The wheel was rotated downwards or towards the user
        camera.zoom++;
    }
});
function getMag(v) {
    let dx = -v.x;
    let dy = -v.y;
    return Math.sqrt(dx * dx + dy * dy);
}
function normalize(v) {
    let dx = -v.x;
    let dy = -v.y;
    let d = Math.sqrt(dx * dx + dy * dy);
    return { x: dx / d, y: dy / d };
}
window.onmousedown = function () {
    mouse.down = true;
}
window.onmouseup = function () {
    mouse.down = false;
}
function startSound(sound) {
    sound.cloneNode().play();
}
