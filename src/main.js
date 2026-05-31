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

  // 1. Matériau de l'image (Double-face activé par défaut)
  const picMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });

  textureLoader.load(
    imagePath,
    function (texture) {
      // Sécurité si l'accès aux dimensions brutes de l'image saute
      const imgWidth = texture.image ? texture.image.width : 0;
      const imgHeight = texture.image ? texture.image.height : 0;

      // Si l'image a un problème de lecture, on applique un ratio de 1 (carré)
      let aspectRatio = 1;
      if (imgWidth > 0 && imgHeight > 0) {
        aspectRatio = imgWidth / imgHeight;
      }

      let finalWidth = targetWidth;
      let finalHeight = targetWidth;

      // Gestion de l'orientation pour éviter les déformations immenses
      if (aspectRatio >= 1) {
        finalWidth = targetWidth;
        finalHeight = targetWidth / aspectRatio;
      } else {
        finalHeight = targetWidth;
        finalWidth = targetWidth * aspectRatio;
      }

      // Sécurité absolue anti-NaN et anti-Infinity
      if (isNaN(finalWidth) || !isFinite(finalWidth)) finalWidth = 3;
      if (isNaN(finalHeight) || !isFinite(finalHeight)) finalHeight = 3;

      // --- LE CADRE DE SÉCURITÉ VISUEL ---
      // On crée une fine boîte en 3D légèrement plus grande que l'image.
      // Si la texture bugue, tu verras au moins ce cadre sombre sur le mur !
      const frameGeo = new THREE.BoxGeometry(
        finalWidth + 0.1,
        finalHeight + 0.1,
        0.05,
      );
      const frameMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.set(0, 0, 0.01); // Plaqué au fond du groupe
      group.add(frameMesh);

      // Création du Mesh de l'image
      const picGeo = new THREE.PlaneGeometry(finalWidth, finalHeight);
      picMat.map = texture;
      picMat.needsUpdate = true;

      const painting = new THREE.Mesh(picGeo, picMat);
      painting.position.set(0, 0, 0.04); // Placé juste devant son cadre pour éviter le Z-fighting
      group.add(painting);

      // Ajustement dynamique du texte explicatif à droite de l'œuvre
      textMesh.position.set(finalWidth / 2 + 1.2, -0.2, 0.02);
    },
    undefined,
    function (err) {
      console.error(
        "Erreur critique lors du chargement de la texture : " + imagePath,
        err,
      );
    },
  );

  // 2. Le Texte explicatif (Généré via un Canvas HTML)
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#222222";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(title, 20, 50);
  ctx.font = "20px sans-serif";

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

  group.position.set(x, y, z);
  group.rotation.y = rotationY;
  scene.add(group);
}

// Ajoute tes œuvres ici, tu pourras ajuster les coordonnées à tâtons.
addArtwork(
  "Portfolio.png",
  "Amaury Compin",
  "Première Année Game Bachelor E-Artsup Toulouse",
  -6.31,
  2.19,
  3.07,
  1.57,
);
addArtwork("Edito.png", " ", " ", -6.31, 2.01, -2.86, 1.57);
addArtwork("Sommaire.png", " ", " ", -0.21, 2.4, -12.51, 0.0);
addArtwork("Quisuisje.png", " ", " ", 6.28, 2.22, -3.9, -1.57);
addArtwork("Contact.png", " ", " ", 1.94, 2.21, 10.48, -1.57);
addArtwork("Titre-1_1.png", " ", " ", 29.93, 2.17, -6.43, -1.57);
addArtwork("Danslecadre.png", " ", " ", 29.93, 2.36, -4.13, -1.57);
addArtwork("Contexte.png", " ", " ", 29.93, 2.38, 0.02, -1.57);
addArtwork("Contraintesthematiques.png", " ", " ", 29.93, 2.32, 4.15, -1.57);
addArtwork("Triostellarium-back_2.png", " ", " ", 24.35, 2.36, 7.43, 3.14);
addArtwork("Jaune.png", " ", " ", 18.41, 2.37, 4.01, 1.57);
addArtwork("Rouge.png", " ", " ", 18.41, 2.25, 0.18, 1.57);
addArtwork("Violet.png", " ", " ", 18.41, 2.21, -4.02, 1.57);
// GameJam
addArtwork("Titre2.png", " ", " ", 36.67, 1.85, -13.01, -1.57);
addArtwork("Lensbot.png", " ", " ", 40.38, 1.99, -8.27, 3.14);
addArtwork("UX-UI.png", " ", " ", 43.71, 2.24, -12.67, -1.57);
addArtwork("Credits_Lensbot.png", " ", " ", 43.71, 2.21, -19.64, -1.57);
addArtwork("Camfull.png", " ", " ", 43.71, 2.11, -24.75, -1.57);
addArtwork("Plinco.png", " ", " ", 40.16, 2.16, -28.99, 0.0);
addArtwork("Maze.png", " ", " ", 34.95, 2.21, -28.99, 0.0);
addArtwork("Menu1.png", " ", " ", 31.1, 2.1, -23.95, 1.57);
addArtwork("Menu2.png", " ", " ", 37.35, 2.01, -15.45, 1.57);
// Aspirinthe
addArtwork("Titre3.png", " ", " ", 31.62, 2.02, -18.07, 0.0);
addArtwork("Plateau.png", " ", " ", 19.85, 3.33, -19.98, 1.57);
addArtwork("Contexte_aspirinthe.png", " ", " ", 19.85, 1.71, -20.07, 1.57);
addArtwork("Objectif.png", " ", " ", 19.85, 2.1, -23.49, 1.57);
addArtwork("Credits_aspirinthe.png", " ", " ", 19.85, 2.03, -26.93, 1.57);
addArtwork("Web_aspirinthe.png", " ", " ", 22.65, 2.14, -29.0, 0.0);
addArtwork("Unity_aspi.png", " ", " ", 26.74, 2.09, -29.0, 0.0);
addArtwork("Code.png", " ", " ", 30.48, 2.24, -26.37, -1.57);
addArtwork("Image_IRL.jpg", " ", " ", 30.48, 2.13, -22.34, -1.57);
// Texturing 3D
addArtwork("Titre4.png", " ", " ", 16.94, 1.96, -18.11, 0.0);
addArtwork("Painting3D.png", " ", " ", 5.5, 1.99, -20.8, 1.57);
addArtwork("Projet-3D.png", " ", " ", 5.5, 1.99, -25.26, 1.57);
addArtwork("Rust.png", " ", " ", 8.1, 1.96, -29.23, 0.0);
addArtwork("Pot1.png", " ", " ", 12.73, 1.95, -29.23, 0.0);
addArtwork("Pot2.png", " ", " ", 15.92, 1.96, -26.59, -1.57);
addArtwork("Pot3.png", " ", " ", 15.92, 1.96, -22.01, -1.57);
//Dino
addArtwork("Titre5.png", " ", " ", 2.32, 2.02, -18.07, 0.0);
addArtwork("Stopmotion.png", " ", " ", -8.04, 1.81, -20.3, 1.57);
addArtwork("GDevelop.png", " ", " ", -8.04, 1.82, -24.77, 1.57);
addArtwork("Triple_dino.png", " ", " ", -5.4, 2.06, -28.78, 0.0);
addArtwork("StopDino.png", " ", " ", -1.56, 2.04, -28.78, 0.0);
addArtwork("DinoGame.png", " ", " ", 1.3, 1.95, -25.41, -1.57);
addArtwork("DinoCode.png", " ", " ", 1.3, 1.9, -21.46, -1.57);
// Garona
addArtwork("Titre6.png", " ", " ", -11.88, 2.08, -14.5, 1.57);
addArtwork("PowerTrio.png", " ", " ", -14.58, 2.12, -4.99, 3.14);
addArtwork("Identitevisuelle.png", " ", " ", -18.77, 2.13, -4.99, 3.14);
addArtwork("Logo.png", " ", " ", -22.25, 2.07, -7.41, 1.57);
addArtwork("Pochettes.png", " ", " ", -22.25, 2.06, -10.61, 1.57);
addArtwork("BigGarona.png", " ", " ", -19.66, 2.12, -13.52, 0.0);
addArtwork("LivretCD.png", " ", " ", -15.29, 2.07, -13.52, 0.0);
// Dessin numerique
addArtwork("Titre7.png", " ", " ", -11.92, 2.19, -1.24, 1.57);
addArtwork("Photoshop.png", " ", " ", -14.37, 1.91, -0.34, 0.0);
addArtwork("Photoshop-Image.png", " ", " ", -17.87, 1.88, -0.34, 0.0);
addArtwork("Rose.png", " ", " ", -21.92, 1.88, -0.34, 0.0);
addArtwork("Rose-Image.png", " ", " ", -25.22, 1.91, -0.34, 0.0);
addArtwork("Hist-Nat.png", " ", " ", -27.75, 1.9, 3.42, 1.57);
addArtwork("Hist-Nat-Image.png", " ", " ", -27.75, 1.87, 6.39, 1.57);
addArtwork("Pirates.png", " ", " ", -27.75, 1.87, 10.47, 1.57);
addArtwork("Pirates-Image.png", " ", " ", -27.75, 1.87, 13.53, 1.57);
addArtwork("Boire.png", " ", " ", -27.75, 1.74, 17.79, 1.57);
addArtwork("Boire-Image.png", " ", " ", -24.41, 1.81, 20.11, 3.14);
// Dessin traditionnel
addArtwork("Titre8.png", " ", " ", -20.19, 1.91, 11.6, -3.14);
addArtwork("DessinTrad.png", " ", " ", -17.14, 1.89, 11.6, -3.14);
addArtwork("Img1.png", " ", "", -12.48, 1.88, 11.6, 0.44);
addArtwork("Img2.png", " ", " ", -8.1, 1.92, 14.82, 1.57);
addArtwork("Img3.png", " ", " ", -8.1, 1.91, 19.27, 1.57);
addArtwork("Img4.png", " ", " ", -2.94, 2.05, 23.28, -0.83);
addArtwork("Img5.png", " ", " ", 1.94, 2.0, 18.54, -1.57);
addArtwork("Merci.png", " ", " ", -4.62, 1.96, 7.28, 0.0);
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
