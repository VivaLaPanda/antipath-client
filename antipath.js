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
    this.vx = 4;
    this.set_animation('walk_right');

  } else if (my_game.key_pressed("a")) {
    this.vx = -4;
    this.set_animation('walk_left');
  } else {
    this.set_animation('idle');
  }
  if (my_game.key_pressed("w") && this.can_jump) {
    this.can_jump = false;
    this.vy = 15;
  }

  my_game.scene.center_on(this);
}
extend(glixl.Sprite, Player);

var SceneFromServer = function(scene, serverData, context) {

}

var Example = function () {
  glixl.Game.call(this, {});

  var sprite_sheet = new glixl.SpriteSheet({
    context: this.context,
    src: 'spritesheet.png',
    frame_size: [16, 16]
  });

  var scene = new glixl.Scene({
    context: this.context,
    width: this.width * 2,
    height: this.height,
    sprite_sheet: sprite_sheet,
    tile_size: {
      width: 32,
      height: 32
    }
  });


  var connection = new WebSocket('ws://127.0.0.1:9095/server');

  connection.onopen = function () {

  };

  // Log errors
  connection.onerror = function (error) {
    console.error('WebSocket Error ' + error);
  };

  // Log messages from the server
  connection.onmessage = function (serverData) {
    for (var i = 0; i < serverData.length; i++) {
      var row = serverData[i]
      for (var j = 0; j < row.length; j++) {
        var tile = row[j]

        scene.add_tile(new glixl.Tile({
          frame: 0,
          x: i * 32,
          y: j * 32 + 32,
          z: tile.height,
          width: 32,
          height: 32
        }));

        if (tile.entity != null) {
          var sprite = new Player({
            frame: 6,
            x: i - 16,
            y: j - 16,
            z: entity.height,
            width: 32,
            height: 32
          });

          sprite.add_animation('walk_right', [18, 19, 20, 21, 22, 23], 60);
          sprite.add_animation('walk_left', [24, 25, 26, 27, 28, 29], 60);
          sprite.set_animation('idle'); // Default animation created by Sprite constructor

          scene.add_sprite(sprite);
        }
      }
    }
  };

  this.set_scene(scene);
}

Example.prototype.update = function () {
  document.getElementById('fps').innerHTML = this.fps;
}
extend(glixl.Game, Example);


my_game = new Example();
my_game.start();
