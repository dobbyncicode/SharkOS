document.addEventListener('click', function(e) {
  const btn = e.target.closest('#game-btn');
  if (!btn) return;
  
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  
  const isMobile = window.innerWidth <= 600;
  const canvasWidth = isMobile ? Math.min(320, window.innerWidth - 40) : 400;
  const canvasHeight = isMobile ? 200 : 300;
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  const gameConfig = window.gameConfig || { lives: 3, spawnRate: 0.02, heartSpeed: { min: 2, max: 4 } };
  const sharkEmoji = window.sharkEmoji || '🦈';
  
  let shark = { x: canvasWidth / 2 - 25, y: canvasHeight - 40, width: 50, height: 30, speed: 8 };
  let hearts = [];
  let score = 0;
  let lives = gameConfig.lives;
  let gameRunning = true;
  
  document.getElementById('game-score').textContent = score;
  document.getElementById('game-lives').textContent = '❤️'.repeat(lives);
  btn.textContent = 'Restart';
  
  function update() {
    if (!gameRunning) return;
    
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (Math.random() < gameConfig.spawnRate) {
      hearts.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        size: 20,
        speed: gameConfig.heartSpeed.min + Math.random() * (gameConfig.heartSpeed.max - gameConfig.heartSpeed.min)
      });
    }
    
    hearts = hearts.filter(heart => {
      heart.y += heart.speed;
      
      ctx.fillStyle = '#ff6b9d';
      ctx.font = heart.size + 'px Arial';
      ctx.fillText('❤️', heart.x, heart.y);
      
      if (heart.y > canvas.height) {
        lives--;
        document.getElementById('game-lives').textContent = '❤️'.repeat(Math.max(0, lives));
        
        if (lives <= 0) {
          gameRunning = false;
          btn.textContent = 'Play Again';
        }
        return false;
      }
      
      if (heart.y > shark.y - heart.size && 
          heart.y < shark.y + shark.height &&
          heart.x > shark.x && 
          heart.x < shark.x + shark.width) {
        score++;
        document.getElementById('game-score').textContent = score;
        return false;
      }
      
      return true;
    });
    
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '20px Arial';
    ctx.fillText(sharkEmoji, shark.x, shark.y);
    
    requestAnimationFrame(update);
  }
  
  update();
  
  document.onkeydown = function(e) {
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft' && shark.x > 0) shark.x -= shark.speed;
    if (e.key === 'ArrowRight' && shark.x < canvas.width - shark.width) shark.x += shark.speed;
    if (e.key === 'ArrowUp' && shark.y > 0) shark.y -= shark.speed;
    if (e.key === 'ArrowDown' && shark.y < canvas.height - shark.height) shark.y += shark.speed;
  };
  
  document.onmousemove = function(e) {
    if (!gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    shark.x = e.clientX - rect.left - shark.width / 2;
    shark.y = e.clientY - rect.top - shark.height / 2;
  };
});
