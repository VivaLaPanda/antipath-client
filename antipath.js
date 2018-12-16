// Sync with server
var connection = new WebSocket('ws://127.0.0.1:9095/server');
var tileSize = 32;

var action = {
  Movement: 0
}

var Player = function (parameters) {
  parameters.speed = 128;
  glixl.Sprite.call(this, parameters);

  this.vx = 0;
  this.vy = 0;
  this.speed = 1;
  this.can_jump = true;
}

Player.prototype.update = function () {
  glixl.Sprite.prototype.update.call(this);

  if (my_game.key_pressed("d")) {
    this.vx = this.speed;
    this.set_animation('walk_right');
  } else if (my_game.key_pressed("a")) {
    this.vx = -this.speed;
    this.set_animation('walk_left');
  } else if (my_game.key_pressed("w")) {
    this.vy = this.speed;
  } else if (my_game.key_pressed("s")) {
    this.vy = -this.speed;
  } else {
    this.set_animation('idle');
  }
  // if (my_game.key_pressed("w") && this.can_jump) {
  //   this.can_jump = false;
  //   this.vy = 15;
  // }
  // if (my_game.key_pressed("w") && this.can_jump) {
  //   this.can_jump = false;
  //   this.vy = 15;
  // }

  var posChanged = false;
  if (this.vx != 0 || this.vy != 0) {
    posChanged = true;
  }

  this.x += this.vx;
  if (my_game.scene.collide(this)) {
    this.x -= this.vx;
  }
  this.vx = 0;


  this.y -= this.vy;
  if (my_game.scene.collide(this)) {
    this.y += this.vy;
  }
  this.vy = 0;


  // Send our new position to the server if it changed
  if (posChanged) {
    var action = {
      movement: {
        X: Math.floor(this.x / tileSize),
        Y: Math.floor(this.y / tileSize)
      }
    }

    connection.send(JSON.stringify(action))
  }

  // this.y -= this.vy;
  // if (my_game.scene.collide(this)) {
  //   this.can_jump = true;
  //   this.y += this.vy;
  //   this.vy = 0;
  // }
  // this.vy -= 1; //Gravity
  // if (this.vy < -10)
  //   this.vy = -10;

  my_game.scene.center_on(this);
}
glixl.Sprite.prototype.sync = function (x,y,playerData) {
  x = x * tileSize;
  y = y * tileSize;
  this.z = playerData.altitude * tileSize;
  this.speed = playerData.speed;

  // If we're mostly in sync don't move the player to keep things smooth
  if (Math.abs(x - this.x) < 32 && Math.abs(y - this.y) < 32) {
    return
  }

  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.vz = 0;
  this.set_animation('idle');
}
extend(glixl.Sprite, Player);

var Adversary = function (parameters) {
  parameters.speed = 128;
  glixl.Sprite.call(this, parameters);
}
Adversary.prototype.update = function () {
  glixl.Sprite.prototype.update.call(this);
}
extend(glixl.Sprite, Adversary);

var Antipath = function () {
  glixl.Game.call(this, {});

  var sprite_sheet = new glixl.SpriteSheet({
    context: this.context,
    src: 'spritesheet.png',
    frame_size: [16, 16]
  });

  var scene = new glixl.Scene({
    context: this.context,
    width: this.width * 20,
    height: this.height * 20,
    sprite_sheet: sprite_sheet,
    tile_size: {
      width: tileSize,
      height: tileSize
    }
  });

  for (var i = 0; i < 20; i++) {
    for (var j = 0; j < 20; j++) {
        scene.add_tile(new glixl.Tile({
          frame: 2,
          x: i * tileSize,
          y: j * tileSize,
          z: 0,
          width: tileSize,
          height: tileSize
        }));
    }
  }

  var sprite = new Player({
    frame: 6,
    x: 10 * tileSize,
    y: 10 * tileSize,
    z: tileSize,
    width: tileSize,
    height: tileSize
  });

  sprite.add_animation('walk_right', [18, 19, 20, 21, 22, 23], 60);
  sprite.add_animation('walk_left', [24, 25, 26, 27, 28, 29], 60);
  sprite.set_animation('idle'); // Default animation created by Sprite constructor

  scene.add_sprite(sprite);

  // Map from from ID to sprites
  var entities = {};

  connection.onmessage = function (socketMsg) {
    var serverData = JSON.parse(socketMsg.data);
    // Set grid postitions relative to root
    var rootPos = serverData.GameState.root;

    // Update tiles
    for (var i = 0; i < serverData.GameState.grid.length; i++) {
      var row = serverData.GameState.grid[i]
      for (var j = 0; j < row.length; j++) {
        var tile = row[j]

        scene.add_tile(new glixl.Tile({
          frame: 2,
          x: (rootPos.X + j) * tileSize,
          y: (rootPos.Y + i) * tileSize,
          z: tile.height * tileSize,
          width: tileSize,
          height: tileSize
        }));
      }
    }

    // Update entities
    for (id in serverData.GameState.entities) {
      var entityPos = serverData.GameState.entities[id];
      var entityData = serverData.GameState.grid[entityPos.Y - rootPos.Y][entityPos.X - rootPos.X].entity;
      if (!entities[id]) {
        // The player character is already set, just store the reference and move on
        if (id === serverData.ClientData.playerID) {
          entities[id] = sprite;
          continue;
        }

        // Add a new adversary
        var newPlayer = new Adversary({
          frame: 6,
          x: entityPos.X * tileSize,
          y: entityPos.Y * tileSize,
          z: entityData.altitude * tileSize,
          width: tileSize,
          height: tileSize
        });

        scene.add_sprite(newPlayer);
        entities[id] = newPlayer;
      }

      // Sync the client entity with what's on the server
      entities[id].sync(entityPos.X, entityPos.Y, entityData)
    }

    scene.update();
  };


  this.set_scene(scene);
}

Antipath.prototype.update = function () {
  document.getElementById('fps').innerHTML = this.fps;
}
extend(glixl.Game, Antipath);

my_game = new Antipath();

connection.onopen = function () {
  my_game.start();
};

// Log errors
connection.onerror = function (error) {
  console.error('WebSocket Error ' + error);
};
