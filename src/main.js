import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// --- 1. INITIALISATION DE LA SCÈNE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 1.7, 5); // Position de départ

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// --- 2. CONTRÔLES (PointerLock) ---
const controls = new PointerLockControls(camera, document.body);
const blocker = document.getElementById("blocker");
const instructions = document.getElementById("instructions");

instructions.innerHTML = `
    <p style="font-size:36px; margin-bottom: 10px;"><strong>ENTRER DANS LE PORTFOLIO DE AMAURY</strong></p>
    <p>Cliquez n'importe où pour commencer</p>
    <p style="font-size: 14px; margin-top: 20px;">[ Z, Q, S, D ] Bouger<br/>[ Espace ] Sauter<br/>[ Souris ] Tourner la tête</p>
`;

instructions.addEventListener("click", () => controls.lock());
controls.addEventListener("lock", () => {
  instructions.style.display = "none";
  blocker.style.display = "none";
});
controls.addEventListener("unlock", () => {
  blocker.style.display = "flex";
  instructions.style.display = "";
});
scene.add(camera);

// --- 3. INPUTS CLAVIER ---
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

const onKeyDown = (event) => {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
    case "KeyZ":
      moveForward = true;
      break;
    case "ArrowLeft":
    case "KeyA":
    case "KeyQ":
      moveLeft = true;
      break;
    case "ArrowDown":
    case "KeyS":
      moveBackward = true;
      break;
    case "ArrowRight":
    case "KeyD":
      moveRight = true;
      break;
    case "Space":
      if (canJump === true) {
        velocity.y += 12.0;
        canJump = false;
      }
      break;
  }
};
const onKeyUp = (event) => {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
    case "KeyZ":
      moveForward = false;
      break;
    case "ArrowLeft":
    case "KeyA":
    case "KeyQ":
      moveLeft = false;
      break;
    case "ArrowDown":
    case "KeyS":
      moveBackward = false;
      break;
    case "ArrowRight":
    case "KeyD":
      moveRight = false;
      break;
  }
};
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

// --- 4. LUMIÈRES ---
const ambientLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1.4);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// --- SÉPARATION DES COLLISIONS ---
const walls = [];
const floors = [];

// --- 5. CHARGEMENT DU MODÈLE GLTF ---
const loader = new GLTFLoader();

// ATTENTION : Remplace 'ma_galerie.glb' par le vrai nom de ton fichier placé dans le dossier public
loader.load(
  "ma_galerie.glb", // Le chemin de ton fichier
  function (gltf) {
    const model = gltf.scene;
    scene.add(model);

    // On parcourt tous les objets du modèle 3D
    model.traverse((child) => {
      if (child.isMesh) {
        // Si l'objet s'appelle "Floor_quelquechose", on l'ajoute au sol
        if (child.name.includes("Floor_")) {
          floors.push(child);
        }
        // Si l'objet s'appelle "Wall_quelquechose", on l'ajoute aux murs
        if (child.name.includes("Wall_")) {
          walls.push(child);
        }
      }
    });
    console.log(
      "Modèle chargé ! Sols trouvés :",
      floors.length,
      "Murs trouvés :",
      walls.length,
    );
  },
  undefined,
  function (error) {
    console.error("Erreur lors du chargement du GLTF :", error);
  },
);

// --- 6. FONCTION ARTWORK ---
// --- FONCTION ARTWORK SANS COMPRESSION (PROPORTIONS AUTOMATIQUES) ---
const textureLoader = new THREE.TextureLoader();

function addArtwork(
  imagePath,
  title,
  description,
  x,
  y,
  z,
  rotationY,
  targetWidth = 3,
) {
  const group = new THREE.Group();

  // 1. Chargement de la texture avec gestion du ratio d'aspect
  const picMat = new THREE.MeshPhongMaterial({ color: 0xffffff }); // Matériau réactif à la lumière

  textureLoader.load(imagePath, function (texture) {
    // On récupère la taille d'origine de l'image
    const imgWidth = texture.image.width;
    const imgHeight = texture.image.height;

    // Calcul du ratio d'aspect (ex: 16/9 = 1.77, 1/1 = 1)
    const aspectRatio = imgWidth / imgHeight;

    // On fixe la largeur voulue (targetWidth) et on calcule la hauteur idéale
    const finalWidth = targetWidth;
    const finalHeight = targetWidth / aspectRatio;

    // Création de la géométrie aux proportions parfaites
    const picGeo = new THREE.PlaneGeometry(finalWidth, finalHeight);

    // Application de la texture sur le matériau
    picMat.map = texture;
    picMat.needsUpdate = true;

    // Création du Mesh final de l'œuvre
    const painting = new THREE.Mesh(picGeo, picMat);
    painting.position.set(0, 0, 0.02); // Décollé du mur
    group.add(painting);

    // --- Déplacement dynamique du texte explicatif ---
    // On ajuste la position du texte pour qu'il se place toujours à côté,
    // peu importe la largeur finale du tableau
    textMesh.position.set(finalWidth / 2 + 1.2, -0.2, 0.02);
  });

  // 2. Le Texte explicatif (Généré via un Canvas HTML)
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fond transparent
  ctx.fillStyle = "#222222";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(title, 20, 50);
  ctx.font = "20px sans-serif";

  // Découpage du texte en lignes
  const words = description.split(" ");
  let line = "";
  const lines = [];
  words.forEach((word) => {
    if ((line + word).length > 40) {
      lines.push(line);
      line = word + " ";
    } else {
      line += word + " ";
    }
  });
  lines.push(line);
  lines.forEach((l, index) => ctx.fillText(l, 20, 100 + index * 28));

  const textTexture = new THREE.CanvasTexture(canvas);
  const textGeo = new THREE.PlaneGeometry(2, 1);
  const textMat = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const textMesh = new THREE.Mesh(textGeo, textMat);
  group.add(textMesh);

  // Positionnement et rotation globale du groupe sur le mur
  group.position.set(x, y, z);
  group.rotation.y = rotationY;
  scene.add(group);
}

// Ajoute tes œuvres ici, tu pourras ajuster les coordonnées à tâtons.
addArtwork(
  "Telephone.jpg",
  "Titre",
  "Description...",
  6.28,
  1.96,
  -2.67,
  -1.57,
);
addArtwork(
  "PanoramaV2.png",
  "Panorama",
  "Utilisation de minimum 17 plans pour le contexte du devoir",
  -6.31,
  2.01,
  -2.86,
  1.57,
);

// --- 7. LA BOUCLE DE NAVIGATION ET DE PHYSIQUE (Inchangée) ---
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let prevTime = performance.now();

const horizontalRaycaster = new THREE.Raycaster();
const verticalRaycaster = new THREE.Raycaster();
const playerHeight = 1.7;
// --- HELPER VISUEL DE PLACEMENT ---

// 1. Création d'une petite sphère rouge (le marqueur)
const markerGeo = new THREE.SphereGeometry(0.15, 16, 16);
const markerMat = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: true,
});
const helperMarker = new THREE.Mesh(markerGeo, markerMat);
scene.add(helperMarker);

// 2. Un Raycaster dédié au ciblage
const helperRaycaster = new THREE.Raycaster();

// 3. L'événement : Appuyer sur "P" pour cibler
window.addEventListener("keydown", (event) => {
  // On vérifie que la touche P est pressée et que le joueur contrôle la caméra
  if (event.code === "KeyP" && controls.isLocked) {
    // On tire un rayon depuis le centre exact de l'écran
    helperRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // On cherche ce que le rayon percute parmi tes murs
    const intersects = helperRaycaster.intersectObjects(walls);

    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      const faceNormal = intersects[0].face.normal;

      // On déplace la sphère rouge à l'endroit exact de l'impact
      helperMarker.position.copy(hitPoint);

      // MAGIE MATHÉMATIQUE : On calcule la rotation Y du mur
      // Pour que le tableau soit parfaitement plaqué contre le mur et pas de travers
      const rotationY = Math.atan2(faceNormal.x, faceNormal.z);

      // On affiche le résultat dans la console (F12) prêt à être copié-collé !
      console.log(
        `%c📍 Nouvel emplacement trouvé !`,
        `color: #ff0000; font-weight: bold;`,
      );
      console.log(
        `addArtwork('ton-image.jpg', 'Titre', 'Description...', ${hitPoint.x.toFixed(2)}, ${hitPoint.y.toFixed(2)}, ${hitPoint.z.toFixed(2)}, ${rotationY.toFixed(2)});`,
      );
    }
  }
});

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now();

  if (controls.isLocked === true) {
    const delta = (time - prevTime) / 1000;

    // --- A. DEPLACEMENT PROVISOIRE (Calcul de l'intention de mouvement) ---
    // Friction
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 4.0 * delta; // Gravité

    // Inputs
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    const speed = 50.0;
    if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

    // On sauvegarde la position de départ avant d'appliquer le mouvement
    const oldPosition = camera.position.clone();

    // On applique temporairement le mouvement pour tester où le joueur veut aller
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    camera.position.y += velocity.y * delta;

    // --- B. GRAVITÉ ET COLLISIONS VERTICALES (Sols) ---
    const downDirection = new THREE.Vector3(0, -1, 0);
    verticalRaycaster.set(camera.position, downDirection);
    let onGround = false;

    if (floors.length > 0) {
      const floorIntersections = verticalRaycaster.intersectObjects(floors);
      if (
        floorIntersections.length > 0 &&
        floorIntersections[0].distance <= playerHeight
      ) {
        onGround = true;
        const targetY = floorIntersections[0].point.y + playerHeight;
        // Lissage de la hauteur
        camera.position.y += (targetY - camera.position.y) * 10 * delta;
      }
    }

    if (onGround) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    } else {
      canJump = false;
    }

    // --- C. COLLISIONS HORIZONTALES (Murs et Poteaux) ---
    // Au lieu de deviner les angles avec le regard, on tire des rayons depuis la NOUVELLE position
    // vers l'ANCIENNE position pour voir si on a traversé un mur géométrique.
    if (walls.length > 0) {
      const localDirections = [
        new THREE.Vector3(0, 0, -1), // Devant
        new THREE.Vector3(0, 0, 1), // Derrière
        new THREE.Vector3(-1, 0, 0), // Gauche
        new THREE.Vector3(1, 0, 0), // Droite
      ];

      for (let i = 0; i < localDirections.length; i++) {
        const rotatedDirection = localDirections[i]
          .clone()
          .applyQuaternion(camera.quaternion);
        rotatedDirection.y = 0;
        rotatedDirection.normalize();

        // Origine du rayon au niveau du corps (hauteur 1.0)
        const rayOrigin = new THREE.Vector3(oldPosition.x, 1.0, oldPosition.z);
        horizontalRaycaster.set(rayOrigin, rotatedDirection);

        const intersections = horizontalRaycaster.intersectObjects(walls);

        // Si un mur est trop proche (moins de 1.1m) dans la direction où l'on avance,
        // on réinitialise la coordonnée correspondante à l'ancienne position
        if (intersections.length > 0 && intersections[0].distance < 1.1) {
          if (i === 0 && velocity.z < 0) {
            camera.position.x = oldPosition.x;
            camera.position.z = oldPosition.z;
            velocity.z = 0;
          } // Bloque Z avant
          if (i === 1 && velocity.z > 0) {
            camera.position.x = oldPosition.x;
            camera.position.z = oldPosition.z;
            velocity.z = 0;
          } // Bloque Z arrière
          if (i === 2 && velocity.x > 0) {
            camera.position.x = oldPosition.x;
            camera.position.z = oldPosition.z;
            velocity.x = 0;
          } // Bloque X gauche
          if (i === 3 && velocity.x < 0) {
            camera.position.x = oldPosition.x;
            camera.position.z = oldPosition.z;
            velocity.x = 0;
          } // Bloque X droite
        }
      }
    }

    // Failsafe vide
    if (camera.position.y < -10) {
      velocity.y = 0;
      camera.position.set(0, playerHeight, 5);
      canJump = true;
    }
  }

  prevTime = time;
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
