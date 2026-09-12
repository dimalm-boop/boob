(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const menuOverlay = document.getElementById('menuOverlay');
    const gameoverOverlay = document.getElementById('gameoverOverlay');
    const gameoverScoreEl = document.getElementById('gameoverScore');
    const modalBackdrop = document.getElementById('modalBackdrop');

    const btnPlay = document.getElementById('btnPlay');
    const btnRules = document.getElementById('btnRules');
    const btnRestart = document.getElementById('btnRestart');
    const btnMenu = document.getElementById('btnMenu');
    const btnModalClose = document.getElementById('btnModalClose');
    const INTERNAL_W = 320;
    const INTERNAL_H = 200;
    canvas.width = INTERNAL_W;
    canvas.height = INTERNAL_H;

    let scaleFactor = 1;
    function updateScaleFactor() {
        const rect = canvas.getBoundingClientRect();
        scaleFactor = rect.width / INTERNAL_W;
    }
    updateScaleFactor();
    window.addEventListener('resize', updateScaleFactor);
    const STATE = { MENU: 'menu', PLAYING: 'playing', GAMEOVER: 'gameover' };
    let gameState = STATE.MENU;
    let score = 0;
    let highScore = 0;
    const player = {
        x: 60, y: 146, w: 10, h: 14,
        vy: 0, vx: 0,
        speed: 2.5, onGround: false,
        jumpPower: -6.5, gravity: 0.45
    };
    const groundY = 160;
    const playerStartX = 60;
    const playerStartY = groundY - 14;

    let obstacles = [];
    let obstacleTimer = 0;
    let obstacleInterval = 90;
    let gameSpeed = 2.0;
    let speedIncrement = 0.003;
    let frameCount = 0;
    let particles = [];
    let stars = [];
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * INTERNAL_W,
            y: Math.random() * (INTERNAL_H - 30),
            size: Math.random() < 0.3 ? 2 : 1,
            twinkle: Math.random() * Math.PI * 2,
            speed: 0.02 + Math.random() * 0.05
        });
    }
    let menuCoins = [];
    for (let i = 0; i < 8; i++) {
        menuCoins.push({
            x: 40 + Math.random() * 240,
            y: 30 + Math.random() * 100,
            bobOffset: Math.random() * Math.PI * 2,
            bobSpeed: 0.03 + Math.random() * 0.04
        });
    }
    function drawPixelRect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    }

    function drawPixelCharacter(cx, cy, frame) {
        const bob = frame ? Math.sin(frame * 0.15) * 1 : 0;
        const px = Math.floor(cx);
        const py = Math.floor(cy + bob);
        drawPixelRect(px+2, py+10, 2, 4, '#3a5a8c');
        drawPixelRect(px+6, py+10, 2, 4, '#3a5a8c');
        drawPixelRect(px+1, py+13, 3, 2, '#4a3020');
        drawPixelRect(px+6, py+13, 3, 2, '#4a3020');
        drawPixelRect(px+2, py+5, 6, 6, '#e04050');
        drawPixelRect(px, py+6, 2, 3, '#f0c090');
        drawPixelRect(px+8, py+6, 2, 3, '#f0c090');
        drawPixelRect(px+2, py, 6, 6, '#f5d0a8');
        drawPixelRect(px+3, py+2, 2, 2, '#fff');
        drawPixelRect(px+5, py+2, 2, 2, '#fff');
        drawPixelRect(px+4, py+2, 1, 1, '#111');
        drawPixelRect(px+6, py+2, 1, 1, '#111');
        drawPixelRect(px+1, py-1, 8, 3, '#6b3020');
        drawPixelRect(px+3, py-2, 4, 1, '#6b3020');
    }

    function drawSpike(x, y, w, h) {
        const sx = Math.floor(x), sy = Math.floor(y);
        drawPixelRect(sx, sy+h-3, w, 3, '#5a5a6a');
        const spikeCount = Math.floor(w/4);
        for (let i=0; i<spikeCount; i++) {
            const spikeX = sx + i*(w/spikeCount);
            const spikeW = Math.floor(w/spikeCount);
            drawPixelRect(spikeX, sy, spikeW-1, h-2, '#c04040');
            drawPixelRect(spikeX+1, sy, spikeW-3, h-1, '#e05050');
        }
    }

    function drawBlock(x, y, w, h) {
        const bx = Math.floor(x), by = Math.floor(y);
        drawPixelRect(bx, by, w, h, '#6b5b3a');
        drawPixelRect(bx, by, w, 2, '#8b7b5a');
        drawPixelRect(bx, by, 2, h, '#8b7b5a');
        drawPixelRect(bx+w-2, by, 2, h, '#4b3b1a');
        drawPixelRect(bx, by+h-2, w, 2, '#4b3b1a');
    }

    function resetGame() {
        player.x = playerStartX;
        player.y = playerStartY;
        player.vy = 0;
        player.vx = 0;
        player.onGround = true;
        obstacles = [];
        particles = [];
        obstacleTimer = 0;
        obstacleInterval = 90;
        gameSpeed = 2.0;
        frameCount = 0;
        score = 0;
    }

    function updateGame() {
        frameCount++;
        player.vy += player.gravity;
        player.y += player.vy;
        player.x += player.vx;
        if (player.x < 5) player.x = 5;
        if (player.x > INTERNAL_W - player.w - 5) player.x = INTERNAL_W - player.w - 5;

        if (player.y + player.h >= groundY) {
            player.y = groundY - player.h;
            player.vy = 0;
            player.onGround = true;
        } else {
            player.onGround = false;
        }

        if (player.onGround && player.vy > 2) {
            for (let i=0; i<5; i++) {
                particles.push({
                    x: player.x + player.w/2,
                    y: groundY,
                    vx: (Math.random()-0.5)*3,
                    vy: -(Math.random()*2+1),
                    life: 15+Math.random()*10,
                    color: '#c8b890',
                    size: 2
                });
            }
        }

        gameSpeed += speedIncrement;
        if (obstacleInterval > 35) obstacleInterval = 90 - Math.floor(gameSpeed*7);
        if (obstacleInterval < 30) obstacleInterval = 30;

        obstacleTimer++;
        if (obstacleTimer >= obstacleInterval) {
            obstacleTimer = 0;
            const r = Math.random();
            let type, w, h, y;
            if (r < 0.5) {
                type = 'spike';
                w = 8 + Math.floor(Math.random()*10);
                h = 8 + Math.floor(Math.random()*10);
                y = groundY - h;
            } else if (r < 0.8) {
                type = 'block';
                w = 10 + Math.floor(Math.random()*8);
                h = 12 + Math.floor(Math.random()*10);
                y = groundY - h;
            } else {
                type = 'block';
                w = 14 + Math.floor(Math.random()*6);
                h = 8;
                y = groundY - 30 - Math.random()*30;
            }
            obstacles.push({ x: INTERNAL_W+5, y, w, h, type, passed: false });
        }

        for (let obs of obstacles) obs.x -= gameSpeed;

        obstacles = obstacles.filter(obs => {
            if (obs.x + obs.w < -10) return false;
            if (!obs.passed && obs.x + obs.w < player.x) {
                obs.passed = true;
                score++;
                for (let i=0; i<6; i++) {
                    particles.push({
                        x: obs.x + obs.w/2,
                        y: obs.y,
                        vx: (Math.random()-0.5)*2,
                        vy: -(Math.random()*3+1),
                        life: 20,
                        color: '#f7c948',
                        size: 2
                    });
                }
            }
            return true;
        });
        for (let obs of obstacles) {
            const px1 = player.x+2, py1 = player.y+2;
            const px2 = player.x+player.w-2, py2 = player.y+player.h-1;
            const ox1 = obs.x+1, oy1 = obs.y+1;
            const ox2 = obs.x+obs.w-1, oy2 = obs.y+obs.h-1;
            if (px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1) {
                endGame();
                return;
            }
        }

        particles = particles.filter(p => {
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            return p.life > 0;
        });
    }

    function endGame() {
        gameState = STATE.GAMEOVER;
        if (score > highScore) highScore = score;
        gameoverScoreEl.textContent = 'Счёт: ' + score + ' | Рекорд: ' + highScore;
        gameoverOverlay.classList.add('active');
        for (let i=0; i<20; i++) {
            particles.push({
                x: player.x + player.w/2,
                y: player.y + player.h/2,
                vx: (Math.random()-0.5)*6,
                vy: -(Math.random()*5+2),
                life: 25+Math.random()*20,
                color: Math.random()<0.5 ? '#f04e6e' : '#f7c948',
                size: 2+Math.random()*2
            });
        }
    }

    function drawMenuScene() {
        ctx.fillStyle = '#0d1b2a'; ctx.fillRect(0,0,INTERNAL_W,INTERNAL_H);
        ctx.fillStyle = '#1a2a3a'; ctx.fillRect(0,90,INTERNAL_W,20);
        for (let x=0; x<INTERNAL_W; x+=12) {
            const h = 8 + Math.sin(x*0.08)*10 + Math.cos(x*0.15)*6;
            drawPixelRect(x,95-h,12,h+15,'#1a3040');
        }
        for (let star of stars) {
            star.twinkle += star.speed;
            const alpha = 0.4 + Math.sin(star.twinkle)*0.4;
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
        }
        drawPixelRect(250,18,18,18,'#f7e8c0');
        drawPixelRect(254,20,10,10,'#0d1b2a');
        drawPixelRect(252,22,3,3,'#e0d0a0');
        drawPixelRect(260,26,2,2,'#e0d0a0');
        drawPixelRect(256,30,4,3,'#e0d0a0');
        drawBlock(180,65,40,6);
        drawBlock(30,80,28,5);
        drawBlock(260,55,35,5);
        for (let coin of menuCoins) {
            coin.bobOffset += coin.bobSpeed;
            const cy = coin.y + Math.sin(coin.bobOffset)*6;
            drawPixelRect(coin.x, cy, 5,5,'#f7c948');
            drawPixelRect(coin.x+1, cy+1, 3,3,'#ffe880');
        }
        drawPixelRect(0,groundY,INTERNAL_W,INTERNAL_H-groundY,'#3a5a30');
        drawPixelRect(0,groundY,INTERNAL_W,3,'#5a8a40');
        for (let x=0; x<INTERNAL_W; x+=6) drawPixelRect(x+Math.sin(x*0.5)*2, groundY-2,3,3,'#4a7a35');
        drawPixelRect(0,groundY+3,INTERNAL_W,INTERNAL_H-groundY-3,'#2a3a1a');
        drawPixelCharacter(playerStartX, playerStartY, frameCount);
        drawBlock(140,groundY-18,16,18);
        drawBlock(200,groundY-10,10,10);
        drawSpike(250,groundY-12,16,12);
    }

    function drawGameScene() {
        const grad = ctx.createLinearGradient(0,0,0,INTERNAL_H);
        grad.addColorStop(0,'#1a3a5c'); grad.addColorStop(0.7,'#3a6a9c'); grad.addColorStop(1,'#5a8ab0');
        ctx.fillStyle = grad; ctx.fillRect(0,0,INTERNAL_W,INTERNAL_H);
        for (let i=0; i<5; i++) {
            const cx = ((i*70+frameCount*0.3) % (INTERNAL_W+60))-30;
            drawPixelRect(cx,25+i*8,28,8,'rgba(255,255,255,0.5)');
            drawPixelRect(cx+6,20+i*8,16,6,'rgba(255,255,255,0.45)');
        }
        for (let x=0; x<INTERNAL_W; x+=14) {
            const h = 10 + Math.sin(x*0.06+frameCount*0.01)*8;
            drawPixelRect(x,100-h,14,h+60,'#2a4a3a');
        }
        drawPixelRect(0,groundY,INTERNAL_W,INTERNAL_H-groundY,'#4a6a35');
        drawPixelRect(0,groundY,INTERNAL_W,3,'#6a9a4a');
        for (let x=0; x<INTERNAL_W; x+=5) {
            const offset = (frameCount*gameSpeed*0.5 + x) % 10;
            if (offset < 3) drawPixelRect(x,groundY-2,3,3,'#5a8a3a');
        }
        for (let obs of obstacles) {
            if (obs.type === 'spike') drawSpike(obs.x,obs.y,obs.w,obs.h);
            else drawBlock(obs.x,obs.y,obs.w,obs.h);
        }
        drawPixelCharacter(player.x, player.y, frameCount);
        for (let p of particles) {
            const alpha = Math.min(1, p.life/15);
            if (p.color.startsWith('#')) {
                const r = parseInt(p.color.slice(1,3),16);
                const g = parseInt(p.color.slice(3,5),16);
                const b = parseInt(p.color.slice(5,7),16);
                ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
            }
            ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px "Press Start 2P", "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('СЧЁТ: ' + score, INTERNAL_W-8, 14);
        ctx.textAlign = 'left';
        if (frameCount < 120 && score === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '6px "Press Start 2P", "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ПРОБЕЛ / КЛИК = ПРЫЖОК', INTERNAL_W/2, 40);
            ctx.textAlign = 'left';
        }
    }

    function drawGameOverScene() {
        drawGameScene();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0,0,INTERNAL_W,INTERNAL_H);
    }

    function gameLoop() {
        updateScaleFactor();
        if (gameState === STATE.MENU) {
            frameCount++;
            drawMenuScene();
        } else if (gameState === STATE.PLAYING) {
            updateGame();
            drawGameScene();
        } else if (gameState === STATE.GAMEOVER) {
            particles = particles.filter(p => {
                p.x += p.vx; p.y += p.vy;
                p.vy += 0.15;
                p.life--;
                return p.life > 0;
            });
            drawGameOverScene();
        }
        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        resetGame();
        gameState = STATE.PLAYING;
        menuOverlay.classList.remove('active'); menuOverlay.classList.add('hidden');
        gameoverOverlay.classList.remove('active'); gameoverOverlay.classList.add('hidden');
        gameoverOverlay.style.opacity = '0'; gameoverOverlay.style.pointerEvents = 'none';
    }
    function goToMenu() {
        gameState = STATE.MENU;
        menuOverlay.classList.add('active'); menuOverlay.classList.remove('hidden');
        gameoverOverlay.classList.remove('active'); gameoverOverlay.classList.add('hidden');
        gameoverOverlay.style.opacity = '0'; gameoverOverlay.style.pointerEvents = 'none';
        obstacles = []; particles = []; frameCount = 0;
    }
    function restartGame() {
        resetGame();
        gameState = STATE.PLAYING;
        gameoverOverlay.classList.remove('active'); gameoverOverlay.classList.add('hidden');
        gameoverOverlay.style.opacity = '0'; gameoverOverlay.style.pointerEvents = 'none';
        menuOverlay.classList.remove('active'); menuOverlay.classList.add('hidden');
    }

    btnPlay.addEventListener('click', startGame);
    btnRestart.addEventListener('click', restartGame);
    btnMenu.addEventListener('click', goToMenu);
    btnRules.addEventListener('click', () => modalBackdrop.classList.add('active'));
    btnModalClose.addEventListener('click', () => modalBackdrop.classList.remove('active'));
    modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) modalBackdrop.classList.remove('active'); });

    const keys = {};
    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (gameState === STATE.PLAYING && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) {
            e.preventDefault();
            if (player.onGround) {
                player.vy = player.jumpPower; player.onGround = false;
                for (let i=0;i<4;i++) particles.push({ x: player.x+player.w/2, y: player.y+player.h, vx: (Math.random()-0.5)*2, vy: Math.random()*1.5, life:10, color:'#e8e0d0', size:2 });
            }
        }
        if (gameState === STATE.GAMEOVER && e.code === 'Space') { e.preventDefault(); restartGame(); }
        if (e.code === 'Escape') {
            if (gameState === STATE.PLAYING || gameState === STATE.GAMEOVER) goToMenu();
            if (modalBackdrop.classList.contains('active')) modalBackdrop.classList.remove('active');
        }
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });

    function handleMovement() {
        if (gameState !== STATE.PLAYING) { player.vx = 0; return; }
        player.vx = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) player.vx = -player.speed;
        if (keys['ArrowRight'] || keys['KeyD']) player.vx = player.speed;
    }
    setInterval(handleMovement, 16);

    canvas.addEventListener('click', () => {
        if (gameState === STATE.PLAYING && player.onGround) {
            player.vy = player.jumpPower; player.onGround = false;
            for (let i=0;i<4;i++) particles.push({ x: player.x+player.w/2, y: player.y+player.h, vx: (Math.random()-0.5)*2, vy: Math.random()*1.5, life:10, color:'#e8e0d0', size:2 });
        }
        if (gameState === STATE.GAMEOVER) restartGame();
    });
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        if (gameState === STATE.PLAYING && player.onGround) {
            player.vy = player.jumpPower; player.onGround = false;
            for (let i=0;i<4;i++) particles.push({ x: player.x+player.w/2, y: player.y+player.h, vx: (Math.random()-0.5)*2, vy: Math.random()*1.5, life:10, color:'#e8e0d0', size:2 });
        }
        if (gameState === STATE.GAMEOVER) restartGame();
    }, { passive: false });
    gameState = STATE.MENU;
    menuOverlay.classList.add('active'); menuOverlay.classList.remove('hidden');
    gameoverOverlay.classList.remove('active'); gameoverOverlay.classList.add('hidden');
    gameoverOverlay.style.opacity = '0'; gameoverOverlay.style.pointerEvents = 'none';
    resetGame();
    frameCount = 0;
    gameLoop();
})();
