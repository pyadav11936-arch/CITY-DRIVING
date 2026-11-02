(() => {
  const $ = id => document.getElementById(id);
  const scoreEl = $('score'), coinsEl = $('coins'), bestEl = $('best');

  let scene, camera, renderer, clock;
  let player, playerBody, playerHead;
  let running = false, score = 0, coins = 0, speed = 19;
  let lane = 0, jumpY = 0, jumpV = 0, sliding = 0;
  let spawnTimer = 0, roadMarks = [];

  const objects = [];
  const coinObjects = [];
  const laneX = [-3, 0, 3];
  const mats = {};
  const bestKey = 'metroRush3DBest';

  let best = Number(localStorage.getItem(bestKey) || 0);
  bestEl.textContent = best;

  function material(color, roughness = .8, metalness = 0) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness
    });
  }

  function box(w, h, d, mat, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      mat
    );

    mesh.position.set(x, y, z);
    scene.add(mesh);

    return mesh;
  }

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x91d7f5);
    scene.fog = new THREE.Fog(0x91d7f5, 35, 115);

    camera = new THREE.PerspectiveCamera(
      62,
      innerWidth / innerHeight,
      .1,
      180
    );

    camera.position.set(0, 7.2, 13.5);
    camera.lookAt(0, 1.3, -7);

    renderer = new THREE.WebGLRenderer({
      antialias: true
    });

    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    scene.add(
      new THREE.HemisphereLight(
        0xffffff,
        0x526070,
        2.0
      )
    );

    const sun = new THREE.DirectionalLight(0xffffff, 2.1);
    sun.position.set(-8, 16, 8);
    sun.castShadow = true;
    scene.add(sun);

    mats.ground = material(0x384b59);
    mats.road = material(0x4b555e, .9);
    mats.rail = material(0xb8c2c9, .35, .7);
    mats.sleeper = material(0x5a4033);
    mats.yellow = material(0xffcf36, .55);
    mats.red = material(0xe84a4a);
    mats.blue = material(0x2389d7);
    mats.white = material(0xf3f5f7);
    mats.dark = material(0x202b38);
    mats.skin = material(0xf0b88b);
    mats.green = material(0x20b77a);

    mats.coin = new THREE.MeshStandardMaterial({
      color: 0xffd329,
      metalness: .75,
      roughness: .2,
      emissive: 0x654000
    });

    // ROAD

    box(
      70, .5, 180,
      material(0x26323b),
      0, -.55, -55
    );

    box(
      10.2, .16, 180,
      material(0x343b42),
      0, -.27, -55
    );

    box(
      .22, .12, 180,
      material(0xf2d34f),
      -5.25, -.17, -55
    );

    box(
      .22, .12, 180,
      material(0xf2d34f),
      5.25, -.17, -55
    );

    // ROAD LINES

    for (const x of [-1.5, 1.5]) {
      for (let z = 10; z > -145; z -= 8) {
        const mark = box(
          .12, .035, 3.5,
          material(0xf4f4e9),
          x, -.16, z
        );

        roadMarks.push(mark);
      }
    }

    // CITY BUILDINGS

    const buildingMats = [
      0xe8a65b,
      0x6d9fc1,
      0xc97878,
      0x8caa83,
      0x9b8bc2
    ];

    for (let side of [-1, 1]) {
      for (let i = 0; i < 24; i++) {
        const z = -i * 7 - 8;
        const h = 5 + Math.random() * 13;
        const w = 3 + Math.random() * 3;

        const bm = material(
          buildingMats[i % buildingMats.length]
        );

        const b = box(
          w, h, 4,
          bm,
          side * (8 + Math.random() * 4),
          h / 2 - .3,
          z
        );

        b.castShadow = true;

        for (let yy = 1.4; yy < h - 1; yy += 2.3) {
          box(
            .12, .8, .8,
            material(0xffe9a5),
            b.position.x - side * (w / 2 + .07),
            yy,
            z
          );
        }
      }
    }

    // LANDMARKS

    const ivory = material(0xf1e7d0, .75);
    const sandstone = material(0xa9472c, .8);
    const roofMat = material(0x7c3d2b);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x249ac2,
      roughness: .28,
      metalness: .12,
      transparent: true,
      opacity: .88
    });

    // RIVER

    box(
      13, .16, 180,
      waterMat,
      18, -.30, -55
    );

    box(
      .65, .45, 180,
      material(0x789b62),
      11.2, -.22, -55
    );

    box(
      .65, .45, 180,
      material(0x789b62),
      24.8, -.22, -55
    );

    // BIG HOUSES

    for (const side of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        const z = -i * 18 - 12;
        const x = side * (8.4 + (i % 2) * 1.1);

        const houseMat = material([
          0xf0d6b5,
          0xe8c9a0,
          0xd8dfd1,
          0xf1e2cc
        ][i % 4]);

        const house = box(
          5.2, 6.5, 7.5,
          houseMat,
          x, 2.95, z
        );

        house.castShadow = true;

        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(4.1, 2.2, 4),
          roofMat
        );

        roof.rotation.y = Math.PI / 4;
        roof.position.set(x, 7.25, z);
        scene.add(roof);

        for (const wx of [-1.45, 1.45]) {
          for (const wy of [2.1, 4.3]) {
            box(
              .9, 1.25, .12,
              material(0x78b8d1),
              x + wx, wy, z + 3.82
            );
          }
        }

        box(
          1.05, 2.2, .14,
          roofMat,
          x, 1.05, z + 3.9
        );
      }
    }

    // TAJ MAHAL

    const tajX = -15;
    const tajZ = -34;

    box(10, .7, 7, ivory, tajX, .15, tajZ);
    box(8, 4.5, 5.5, ivory, tajX, 2.55, tajZ);

    const tajDome = new THREE.Mesh(
      new THREE.SphereGeometry(
        2.35, 24, 16,
        0, Math.PI * 2,
        0, Math.PI / 2
      ),
      ivory
    );

    tajDome.position.set(tajX, 4.8, tajZ);
    scene.add(tajDome);

    const finial = new THREE.Mesh(
      new THREE.ConeGeometry(.18, .9, 10),
      material(0xc6a45a)
    );

    finial.position.set(tajX, 7.15, tajZ);
    scene.add(finial);

    for (const dx of [-4.5, 4.5]) {
      for (const dz of [-2.5, 2.5]) {
        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(.42, .58, 6.5, 12),
          ivory
        );

        tower.position.set(
          tajX + dx,
          3.2,
          tajZ + dz
        );

        scene.add(tower);

        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(.55, 12, 8),
          ivory
        );

        cap.position.set(
          tajX + dx,
          6.55,
          tajZ + dz
        );

        scene.add(cap);
      }
    }

    for (const dx of [-2.3, 0, 2.3]) {
      box(
        .95, 2.5, .08,
        material(0x8a9ba2),
        tajX + dx, 2.15, tajZ + 2.8
      );
    }

    // RED FORT

    const fortX = 14;
    const fortZ = -82;

    box(
      13, 4.5, 3,
      sandstone,
      fortX, 2.1, fortZ
    );

    box(
      2.3, 7, 3,
      sandstone,
      fortX - 5.3, 3.35, fortZ
    );

    box(
      2.3, 7, 3,
      sandstone,
      fortX + 5.3, 3.35, fortZ
    );

    for (const dx of [-5.3, 5.3]) {
      const turret = new THREE.Mesh(
        new THREE.CylinderGeometry(1.35, 1.5, .65, 12),
        roofMat
      );

      turret.position.set(
        fortX + dx,
        7.2,
        fortZ
      );

      scene.add(turret);
    }

    box(
      2.5, 3.2, .12,
      material(0x4a2b22),
      fortX, .9, fortZ + 1.56
    );

    // SIGN BOARDS

    function signBoard(label, x, z) {
      const boardMat = material(0x174d3c);
      const postMat = material(0x5b4635);

      box(.16, 2.4, .16, postMat, x - 1.5, 1.2, z);
      box(.16, 2.4, .16, postMat, x + 1.5, 1.2, z);

      box(3.6, 1.15, .2, boardMat, x, 2.55, z);

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;

      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#174d3c';
      ctx.fillRect(0, 0, 512, 160);

      ctx.strokeStyle = '#f5d36b';
      ctx.lineWidth = 9;
      ctx.strokeRect(7, 7, 498, 146);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 256, 82);

      const tex = new THREE.CanvasTexture(canvas);

      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(3.45, 1.0),
        new THREE.MeshBasicMaterial({ map: tex })
      );

      face.position.set(x, 2.55, z + .115);
      scene.add(face);
    }

    signBoard('TAJ MAHAL', -9.5, -24);
    signBoard('RED FORT', 9.5, -70);
    signBoard('RIVER VIEW', 9.5, -112);

    // PLAYER

    player = new THREE.Group();
    scene.add(player);

    playerBody = new THREE.Mesh(
      new THREE.BoxGeometry(.85, 1.15, .55),
      mats.green
    );

    playerBody.position.y = 1.15;
    playerBody.castShadow = true;
    player.add(playerBody);

    playerHead = new THREE.Mesh(
      new THREE.SphereGeometry(.38, 20, 16),
      mats.skin
    );

    playerHead.position.y = 2.0;
    playerHead.castShadow = true;
    player.add(playerHead);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(
        .39, 16, 10,
        0, Math.PI * 2,
        0, Math.PI * .55
      ),
      mats.dark
    );

    hair.position.y = 2.12;
    player.add(hair);

    const legMat = material(0x263e75);

    for (let x of [-.23, .23]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(.25, .65, .3),
        legMat
      );

      leg.position.set(x, .34, 0);
      leg.castShadow = true;
      player.add(leg);
    }

    player.position.set(0, 0, 5);

    window.addEventListener('resize', onResize);
    animate();
  }

  function onResize() {
    if (!camera) return;

    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);
  }

  // OBSTACLES

  function addObstacle(type, l, z) {
    const group = new THREE.Group();

    group.position.set(laneX[l], 0, z);
    scene.add(group);

    if (type === 'car') {
      const carColor = [
        0x2389d7,
        0xe84a4a,
        0xf0a52b,
        0x8b65c7
      ][Math.floor(Math.random() * 4)];

      const carMat = material(carColor, .45);

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, .85, 3.5),
        carMat
      );

      body.position.y = .85;
      body.castShadow = true;
      group.add(body);

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, .85, 1.65),
        material(0x9ed9ec, .35)
      );

      cabin.position.set(0, 1.55, -.15);
      cabin.castShadow = true;
      group.add(cabin);

      for (let x of [-.67, .67]) {
        const light = new THREE.Mesh(
          new THREE.BoxGeometry(.35, .2, .08),
          material(0xfff3b0, .3)
        );

        light.position.set(x, .9, 1.78);
        group.add(light);

        for (let z of [-1.05, 1.05]) {
          const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(.28, .28, .18, 14),
            material(0x15191d)
          );

          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(x * 1.27, .38, z);
          group.add(wheel);
        }
      }

    } else if (type === 'barrier') {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, .8, .45),
        mats.red
      );

      beam.position.y = .65;
      beam.castShadow = true;
      group.add(beam);

      for (let x of [-.8, .8]) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(.2, .9, .25),
          mats.white
        );

        post.position.set(x, .45, 0);
        group.add(post);
      }

    } else {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, .35, .55),
        mats.yellow
      );

      beam.position.y = 1.65;
      group.add(beam);

      for (let x of [-.95, .95]) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(.15, 1.8, .2),
          mats.dark
        );

        post.position.set(x, .9, 0);
        group.add(post);
      }
    }

    objects.push({
      mesh: group,
      type,
      lane: l,
      z,
      passed: false
    });
  }

  // COINS

  function addCoin(l, z) {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(.38, .13, 10, 22),
      mats.coin
    );

    mesh.position.set(laneX[l], 1.25, z);
    mesh.rotation.y = Math.PI / 2;

    scene.add(mesh);
    coinObjects.push(mesh);
  }

  // SPAWN

  function spawn() {
    const l = Math.floor(Math.random() * 3);
    const r = Math.random();

    const type =
      r < .48 ? 'car' :
      r < .76 ? 'barrier' :
      'overhead';

    addObstacle(type, l, -95);

    if (Math.random() < .85) {
      const cl = (l + 1 + Math.floor(Math.random() * 2)) % 3;

      for (let i = 0; i < 5; i++) {
        addCoin(cl, -78 - i * 2.2);
      }
    }
  }

  // CONTROLS

  function move(dir) {
    if (!running) return;

    lane = Math.max(-1, Math.min(1, lane + dir));
  }

  function jump() {
    if (running && jumpY <= .02) {
      jumpV = 10.5;
    }
  }

  function slide() {
    if (running && jumpY < .2) {
      sliding = .65;
    }
  }

  function action(a) {
    if (a === 'left') move(-1);
    if (a === 'right') move(1);
    if (a === 'jump') jump();
    if (a === 'slide') slide();
  }

  window.addEventListener('keydown', e => {
    if (
      [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        ' ',
        'a',
        'd',
        'w',
        's'
      ].includes(e.key)
    ) {
      e.preventDefault();
    }

    if (e.key === 'ArrowLeft' || e.key === 'a') action('left');
    if (e.key === 'ArrowRight' || e.key === 'd') action('right');
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') action('jump');
    if (e.key === 'ArrowDown' || e.key === 's') action('slide');

    if (e.key === 'Enter' && !running) start();
  });

  document.querySelectorAll('.touchbtn').forEach(btn => {
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      action(btn.dataset.action);
    });
  });

  // MOBILE SWIPE

  let touchStart = null;

  window.addEventListener('touchstart', e => {
    if (e.touches.length) {
      touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  }, { passive: true });

  window.addEventListener('touchend', e => {
    if (!touchStart || !e.changedTouches.length) return;

    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;

    if (Math.max(Math.abs(dx), Math.abs(dy)) > 25) {
      if (Math.abs(dx) > Math.abs(dy)) {
        action(dx > 0 ? 'right' : 'left');
      } else {
        action(dy < 0 ? 'jump' : 'slide');
      }
    }

    touchStart = null;
  }, { passive: true });

  // START GAME

  function start() {
    if (!scene) init();

    objects.forEach(o => scene.remove(o.mesh));
    coinObjects.forEach(c => scene.remove(c));

    objects.length = 0;
    coinObjects.length = 0;

    score = 0;
    coins = 0;
    speed = 19;
    lane = 0;
    jumpY = 0;
    jumpV = 0;
    sliding = 0;

    spawnTimer = .7;
    player.position.set(0, 0, 5);

    scoreEl.textContent = '0';
    coinsEl.textContent = '0';

    $('overlay').style.display = 'none';

    running = true;
    clock.getDelta();
  }

  // GAME OVER

  function gameOver() {
    running = false;

    best = Math.max(best, Math.floor(score));

    localStorage.setItem(bestKey, best);
    bestEl.textContent = best;

    $('panel').innerHTML = `
      <h1>RUN OVER!</h1>
      <p>
        Your score: <b>${Math.floor(score)}</b><br>
        Coins collected: <b>${coins}</b><br>
        Best score: <b>${best}</b>
      </p>
      <button id="restartBtn">RUN AGAIN</button>
      <p class="small">
        Tip: switch lanes early when a car is coming.
      </p>
    `;

    $('overlay').style.display = 'flex';

    $('restartBtn').addEventListener('click', start);
  }

  // GAME LOOP

  function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(
      clock ? clock.getDelta() : .016,
      .04
    );

    if (running) {
      score += dt * speed * .55;
      speed = Math.min(31, 19 + score / 500);

      scoreEl.textContent = Math.floor(score);

      player.position.x +=
        (laneX[lane] - player.position.x) *
        Math.min(1, dt * 12);

      if (jumpV !== 0 || jumpY > 0) {
        jumpY += jumpV * dt;
        jumpV -= 25 * dt;

        if (jumpY <= 0) {
          jumpY = 0;
          jumpV = 0;
        }
      }

      if (sliding > 0) sliding -= dt;

      player.position.y = jumpY;

      playerBody.scale.y = sliding > 0 ? .52 : 1;
      playerBody.position.y = sliding > 0 ? .72 : 1.15;

      playerHead.visible = sliding <= 0;

      player.rotation.z =
        (laneX[lane] - player.position.x) * -.04;

      player.rotation.x =
        Math.sin(performance.now() * .012) * .035;

      spawnTimer -= dt;

      if (spawnTimer <= 0) {
        spawn();

        spawnTimer =
          Math.max(.72, 1.35 - (speed - 19) * .035) +
          Math.random() * .25;
      }

      // MOVE OBSTACLES

      for (let i = objects.length - 1; i >= 0; i--) {
        const o = objects[i];

        o.mesh.position.z += speed * dt;

        if (
          o.mesh.position.z < 8 &&
          o.mesh.position.z > -1 &&
          Math.abs(player.position.x - laneX[o.lane]) < 1.35
        ) {
          const safeJump =
            o.type === 'barrier' && jumpY > 1.0;

          const safeSlide =
            o.type === 'overhead' && sliding > 0;

          if (!safeJump && !safeSlide) {
            gameOver();
            break;
          }
        }

        if (o.mesh.position.z > 15) {
          scene.remove(o.mesh);
          objects.splice(i, 1);
        }
      }

      // MOVE AND COLLECT COINS

      for (let i = coinObjects.length - 1; i >= 0; i--) {
        const c = coinObjects[i];

        c.position.z += speed * dt;
        c.rotation.z += dt * 4;

        if (
          Math.abs(c.position.z - player.position.z) < 1.1 &&
          Math.abs(c.position.x - player.position.x) < 1.1 &&
          Math.abs(c.position.y - (1.25 + jumpY)) < 1.5
        ) {
          coins++;
          coinsEl.textContent = coins;

          score += 25;

          scene.remove(c);
          coinObjects.splice(i, 1);
          continue;
        }

        if (c.position.z > 15) {
          scene.remove(c);
          coinObjects.splice(i, 1);
        }
      }

      // ROAD MOVEMENT

      roadMarks.forEach(m => {
        m.position.z += speed * dt;

        if (m.position.z > 14) {
          m.position.z -= 154;
        }
      });

      // CAMERA FOLLOW

      camera.position.x +=
        (player.position.x * .22 - camera.position.x) *
        dt * 2;

      camera.lookAt(
        player.position.x * .18,
        1.4,
        -7
      );
    }

    if (renderer) {
      renderer.render(scene, camera);
    }
  }

  $('startBtn').addEventListener('click', start);

})();