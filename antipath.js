// Sync with server
var connection = new WebSocket('ws://127.0.0.1:9095/server');

var action = {
  Movement: 0
}

var Player = function (parameters) {
  parameters.speed = 128;
  glixl.Sprite.call(this, parameters);

  this.vx = 0;
  this.vy = 0;
  this.can_jump = true;
}

Player.prototype.update = function () {
  glixl.Sprite.prototype.update.call(this);

  if (my_game.key_pressed("d")) {
    //this.vx = 32;
    connection.send("{\"movement\": 1}")
    this.set_animation('walk_right');
  } else if (my_game.key_pressed("a")) {
    //this.vx = -32;
    connection.send("{\"movement\": 2}")
    this.set_animation('walk_left');
  } else if (my_game.key_pressed("w")) {
    //this.vy = 32;
    connection.send("{\"movement\": 0}")
  } else if (my_game.key_pressed("s")) {
    //this.vy = -32;
    connection.send("{\"movement\": 3}")
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
extend(glixl.Sprite, Player);


var Example = function () {
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
      width: 32,
      height: 32
    }
  });

  for (var i = 0; i < 20; i++) {
    for (var j = 0; j < 20; j++) {
        scene.add_tile(new glixl.Tile({
          frame: 2,
          x: i * 32,
          y: j * 32,
          z: 0,
          width: 32,
          height: 32
        }));
    }
  }

  var sprite = new Player({
    frame: 6,
    x: 64 - 16,
    y: 96 - 16,
    z: 32,
    width: 32,
    height: 32
  });

  sprite.add_animation('walk_right', [18, 19, 20, 21, 22, 23], 60);
  sprite.add_animation('walk_left', [24, 25, 26, 27, 28, 29], 60);
  sprite.set_animation('idle'); // Default animation created by Sprite constructor

  scene.add_sprite(sprite);

  // Log messages from the server
  connection.onmessage = function (socketMsg) {
    var serverData = JSON.parse(socketMsg.data);
    for (var i = 0; i < serverData.grid.length; i++) {
      var row = serverData.grid[i]
      for (var j = 0; j < row.length; j++) {
        var tile = row[j]

        if (tile.entity != null) {
          scene.add_tile(new glixl.Tile({
            frame: 1,
            x: j * 32,
            y: i * 32,
            z: 32,
            width: 32,
            height: 32
          }));
        } else {
          scene.add_tile(new glixl.Tile({
            frame: 2,
            x: j * 32,
            y: i * 32,
            z: 0,
            width: 32,
            height: 32
          }));
        }
      }
    }
    scene.update()
  };


  this.set_scene(scene);
}

Example.prototype.update = function () {
  document.getElementById('fps').innerHTML = this.fps;
}
extend(glixl.Game, Example);

my_game = new Example();

connection.onopen = function () {
  my_game.start();
};

// Log errors
connection.onerror = function (error) {
  console.error('WebSocket Error ' + error);
};
