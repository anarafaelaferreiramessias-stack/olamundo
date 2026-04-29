const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameStarted = false;

const FOV = 500;
const BLOCK = 64;
const WORLD_SIZE = 20;
const RENDER_DISTANCE = 8;

const player = {
  x: 5,
  y: 5,
  angle: 0,
  speed: 0.08,
  crouching: false,
  handOffset: 0
};

const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const world = [];
for(let y=0;y<WORLD_SIZE;y++){
  world[y]=[];
  for(let x=0;x<WORLD_SIZE;x++){
    world[y][x] = Math.random() > 0.7 ? 1 : 0;
  }
}

function drawSky(){
  const sky = ctx.createLinearGradient(0,0,0,canvas.height/2);
  sky.addColorStop(0,'#87CEEB');
  sky.addColorStop(1,'#dff6ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,canvas.width,canvas.height/2);
}

function drawGround(){
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0,canvas.height/2,canvas.width,canvas.height/2);
}

function castRays(){
  for(let ray=0; ray<canvas.width; ray++){
    const rayAngle = (player.angle - Math.PI/6) + (ray/canvas.width)*(Math.PI/3);
    for(let depth=0; depth<RENDER_DISTANCE; depth+=0.05){
      const tx = Math.floor(player.x + Math.cos(rayAngle)*depth);
      const ty = Math.floor(player.y + Math.sin(rayAngle)*depth);

      if(world[ty] && world[ty][tx] === 1){
        let wallHeight = (BLOCK * FOV) / (depth * 50);
        if(player.crouching) wallHeight *= 0.8;

        ctx.fillStyle = `rgb(${150-depth*10},${100-depth*8},50)`;
        ctx.fillRect(ray,(canvas.height/2)-wallHeight/2,2,wallHeight);
        break;
      }
    }
  }
}

// Mão do Steve mais detalhada
function drawHand(){
  const baseY = player.crouching ? canvas.height - 140 : canvas.height - 180;

  // braço azul (camisa Steve)
  ctx.fillStyle = '#2196F3';
  ctx.fillRect(canvas.width-180, baseY, 90, 120);

  // mão/pele
  ctx.fillStyle = '#f1c27d';
  ctx.fillRect(canvas.width-130 + player.handOffset, baseY+20, 60, 70);

  // dedos simples
  ctx.fillStyle = '#d8a47f';
  for(let i=0;i<4;i++){
    ctx.fillRect(canvas.width-125 + (i*12) + player.handOffset, baseY+80, 8, 20);
  }
}

function updatePlayer(){
  let moving = false;

  if(keys['w']){
    player.x += Math.cos(player.angle)*player.speed;
    player.y += Math.sin(player.angle)*player.speed;
    moving = true;
  }

  if(keys['s']){
    player.x -= Math.cos(player.angle)*player.speed;
    player.y -= Math.sin(player.angle)*player.speed;
    moving = true;
  }

  if(keys['a']) player.angle -= 0.05;
  if(keys['d']) player.angle += 0.05;

  // Agachar (Shift)
  player.crouching = keys['shift'];

  // animação da mão andando
  if(moving){
    player.handOffset = Math.sin(Date.now()*0.01)*10;
  } else {
    player.handOffset = 0;
  }
}

canvas.addEventListener('click', ()=>{
  const frontX = Math.floor(player.x + Math.cos(player.angle));
  const frontY = Math.floor(player.y + Math.sin(player.angle));

  if(world[frontY]){
    world[frontY][frontX] = world[frontY][frontX] === 1 ? 0 : 1;
  }
});

function drawCrosshair(){
  ctx.strokeStyle='white';
  ctx.beginPath();
  ctx.moveTo(canvas.width/2-10,canvas.height/2);
  ctx.lineTo(canvas.width/2+10,canvas.height/2);
  ctx.moveTo(canvas.width/2,canvas.height/2-10);
  ctx.lineTo(canvas.width/2,canvas.height/2+10);
  ctx.stroke();
}

function gameLoop(){
  if(!gameStarted) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawSky();
  drawGround();
  updatePlayer();
  castRays();
  drawCrosshair();
  drawHand();

  requestAnimationFrame(gameLoop);
}

function startGame(){
  gameStarted = true;
  document.getElementById('menu').style.display = 'none';
  gameLoop();
}

window.addEventListener('resize', ()=>{
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});