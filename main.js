// console.log("My three object: ", THREE);

import * as THREE from './node_modules/three/build/three.js';
// import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import WebGL from 'three/addons/capabilities/WebGL.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
// import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { ControlMode, PointerBehaviour, SpatialControls } from "spatial-controls";
import { NoiseEffect, OutlineEffect, EdgeDetectionMode } from "postprocessing";

let container, blocker, instructions, stats;
let camera, controls, scene, renderer, raycaster;
let position, quaternion;
let ambientLight, sunLight;
let cube;
let enter_button, infoPanelOn, fontPanelOn, info_button, control_container, font_info_container, font_info_close;
const painting_counts = [10, 7, 2, 4, 2, 3, 3, 1, 1, 5, 7, 2, 3, 2, 4];

let INTERSECTED;
const pointer = new THREE.Vector2();
let paintingIDs;
let labelIDs;

// const clock = new THREE.Clock();

init();

function init() {

    container = document.getElementById('container');

    infoPanelOn = true;
    fontPanelOn = false;

    paintingIDs = [];
    labelIDs = [];

    scene = new THREE.Scene(); // create the scene
    // scene.background = new THREE.Color( 0x33b4f5 );
    // scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

    camera = new THREE.PerspectiveCamera(
        75, // Field of view. FOV is the extent of the scene that is seen on the display at any given moment. The value is in degrees.
        window.innerWidth / window.innerHeight, // Aspect ratio, width / height
        0.1, // Near clipping plane. Objects closer to the camera than the value of near won't be rendered
        1200 // Far clipping plane. Objects further away from the camera than the value of far won't be rendered
    );
    camera.position.set( 0, 0, 10 );
    camera.lookAt( 0, 0, 0 );
    position = camera.position;
    quaternion = camera.quaternion;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor(0xffffff);
    container.appendChild( renderer.domElement ); //This is a <canvas> element the renderer uses to display the scene to us.

    // Ambient Light
    ambientLight = new THREE.AmbientLight( 0x424242, 3.0 ); // soft white light. args: color, intensity, distance, decay
    scene.add( ambientLight );

    // Directional Light
    sunLight = new THREE.DirectionalLight( 0xeeeeee, 1.0 ); // args: color, intensity
    sunLight.position.y = 50;
    sunLight.position.x = 0;
    sunLight.position.z = 50;
    scene.add(sunLight);

    // Create the skyBox
    const skyBoxGeometry = new THREE.BoxGeometry( 800, 600, 800 );

    // Create the grass texture
    const grassPlaneTexture = new THREE.TextureLoader().load('asset/SKYBOX/GRASS.png');
    grassPlaneTexture.wrapS = THREE.RepeatWrapping;
    grassPlaneTexture.wrapT = THREE.RepeatWrapping;
    grassPlaneTexture.repeat.set( 26, 26 );

    // Create the sky texture
    const skyCeilingTexture = new THREE.TextureLoader().load('asset/SKYBOX/SKY-C.png');
    // skyCeilingTexture.wrapS = THREE.RepeatWrapping;
    // skyCeilingTexture.wrapT = THREE.RepeatWrapping;
    // skyCeilingTexture.repeat.set( 24, 24 );

    const skyWall1Texture = new THREE.TextureLoader().load('asset/SKYBOX/SKY-W1.png');
    const skyWall2Texture = new THREE.TextureLoader().load('asset/SKYBOX/SKY-W2.png');
    const skyWall3Texture = new THREE.TextureLoader().load('asset/SKYBOX/SKY-W3.png');
    const skyWall4Texture = new THREE.TextureLoader().load('asset/SKYBOX/SKY-W4.png');
    // skyWallTexture.wrapS = THREE.RepeatWrapping;
    // skyWallTexture.wrapT = THREE.RepeatWrapping;
    // skyWallTexture.repeat.set( 1, 1 );
    
    // Combine and map textures to faces
    // front, back, up, down, right, left
    var skyBoxMaterials = [
        new THREE.MeshBasicMaterial({
            map : skyWall1Texture, // 镜头右侧
            side : THREE.DoubleSide,
        }),
        new THREE.MeshBasicMaterial({
            map : skyWall4Texture, // 镜头左侧
            side : THREE.DoubleSide,
        }),
        new THREE.MeshBasicMaterial({
            map : skyCeilingTexture,
            side : THREE.BackSide,
        }),
        new THREE.MeshBasicMaterial({
            map : grassPlaneTexture,
            side : THREE.BackSide,
        }),
        new THREE.MeshBasicMaterial({
            map : skyWall3Texture, // 镜头背面
            side : THREE.DoubleSide,
        }),
        new THREE.MeshBasicMaterial({
            map : skyWall2Texture, // 镜头正面
            side : THREE.DoubleSide,
        }),
    ];
    const skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterials );
    skyBox.position.y = 290;
    skyBox.position.z = -200;
    scene.add( skyBox );

        // Prefabricated skybox globe
    // const skyLoader = new GLTFLoader();

    // skyLoader.load( 'model/skybox_minecraft_daylight/scene.gltf', function ( gltf ) {

    //     gltf.scene.scale.set(100, 100, 100); 
    //     gltf.scene.position.y = 0;
    //     scene.add( gltf.scene );

    // }, undefined, function ( error ) {

    //     console.error( error );

    // } );

    setUpFolders();

    raycaster = new THREE.Raycaster();

    // Show / Hide UI on mouse click
    // Lock controls when UI is displayed
    // Unlock controls when UI is hidden
    blocker = document.getElementById( 'blocker' );
    instructions = document.getElementById( 'instructions' );
    enter_button = document.getElementById( 'enter-button' );

    enter_button.addEventListener( 'click', function (e) {

        infoPanelOn = false;
        e.stopPropagation();

    } );

    font_info_container = document.getElementById('font-info-container');
    font_info_container.style.display = 'none';

    font_info_close = document.getElementById('panel-close');

    font_info_close.addEventListener( 'mouseup', function(e) {
        console.log('click event target: ' + event.currentTarget);

        if ( fontPanelOn ) {
            font_info_container.style.display = 'none';
            fontPanelOn = false;
            e.stopPropagation();
        }

    })

    // Spatial Controls
    controls = new SpatialControls(position, quaternion, renderer.domElement);
    const settings = controls.settings;
    settings.general.mode = ControlMode.FIRST_PERSON;
    settings.pointer.behaviour = PointerBehaviour.DEFAULT;
    settings.zoom.setRange(0.25, 3.0);
	settings.rotation.sensitivity = 2.2;
	settings.rotation.damping = 0.1;
	settings.rotation.minPolarAngle = Number.NEGATIVE_INFINITY;
	settings.rotation.maxPolarAngle = Number.POSITIVE_INFINITY;
	settings.translation.sensitivity = 2;
	settings.translation.damping = 0.1;
	settings.zoom.sensitivity = 0.1;
	settings.zoom.damping = 0.2;

    // Set constraint of movement area
    const box = new THREE.Box3();
	box.min.set(-100, 0, -100);
	box.max.set(100, 0, 100);
	const boxConstraint = ( p ) => box.clampPoint( p, p );
    controls.constraints.add(boxConstraint);

    // Set initial position and orientation of controls
    controls.position = position;
	controls.lookAt( 0, 0, 0 );

    info_button = document.getElementById( 'info-button' );
    info_button.style.display = 'none';
    info_button.addEventListener( 'click', function() {

        infoPanelOn = true;

    })

    control_container = document.getElementById( 'control-container' );
    control_container.style.display = 'none';

    // stats = new Stats();
    // container.appendChild( stats.dom );

    // select painting
    
    window.addEventListener( 'pointermove', onPointerMove );
    window.addEventListener( 'resize', onWindowResize );
    // window.addEventListener( 'click', onClick );
    window.addEventListener( 'mouseup', onMouseUp);

}

function onMouseUp( e ) {
    console.log('click event target: ' + e.currentTarget);
    // determine distance from camera to the selected object
    if ( (!infoPanelOn && !fontPanelOn) && ( INTERSECTED && camera.position.distanceTo(INTERSECTED.position) < 5 )) {
        
        for ( let i = 0; i < paintingIDs.length; i++ ) {
            if ( INTERSECTED.id == paintingIDs[i].id ) {

                console.log ('show font info panel, fontPanelOn is ' + fontPanelOn);

                // Show painting info panel
                let panelImg = font_info_container.getElementsByTagName('img')[0];
                panelImg.src = 'asset/info/' + paintingIDs[i].url;
                
                fontPanelOn = true;
                font_info_container.style.display = '';
                // console.log ('show font info panel, fontPanelOn is ' + fontPanelOn);
                return;

            }
            
        }
        for ( let i = 0; i < labelIDs.length; i++ ) {
            if ( INTERSECTED.id == labelIDs[i].id ) {

                console.log ('Showing folder info panel.  fontPanelOn is ' + fontPanelOn);

                // Show painting info panel
                let panelImg = font_info_container.getElementsByTagName('img')[0];
                panelImg.src = 'asset/info/' + labelIDs[i].url;
                
                fontPanelOn = true;
                font_info_container.style.display = '';
                return;
                
            }
            
        }
    }
    console.log ('show font info panel, fontPanelOn is ' + fontPanelOn);
}

function onClick( event ) {
    // determine distance from camera to the selected object
    if ((!infoPanelOn && !fontPanelOn) 
        && ( INTERSECTED && camera.position.distanceTo(INTERSECTED.position) < 25 ))
         {
            console.log(INTERSECTED);
        
        for ( let i = 0; i < paintingIDs.length; i++ ) {
            if ( INTERSECTED.id == paintingIDs[i].id ) {

                console.log ('show font info panel, fontPanelOn is ' + fontPanelOn);

                // Show painting info panel
                let panelImg = font_info_container.getElementsByTagName('img')[0];
                panelImg.src = 'asset/info/' + paintingIDs[i].url;
                
                fontPanelOn = true;
                font_info_container.style.display = '';
                // console.log ('show font info panel, fontPanelOn is ' + fontPanelOn);
                return;

            }
            
        }
        for ( let i = 0; i < labelIDs.length; i++ ) {
            if ( INTERSECTED.id == labelIDs[i].id ) {

                console.log ('Showing folder info panel.  fontPanelOn is ' + fontPanelOn);

                // Show painting info panel
                let panelImg = font_info_container.getElementsByTagName('img')[0];
                panelImg.src = 'asset/info/' + labelIDs[i].url;
                
                fontPanelOn = true;
                font_info_container.style.display = '';
                return;
                
            }
            
        }
    }
    console.log ('show font info panel, fontPanelOn is ' + fontPanelOn);
}

function onPointerMove( event ) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    if ( (!infoPanelOn && !fontPanelOn) && (INTERSECTED && camera.position.distanceTo(INTERSECTED.position) < 5 )) {
        console.log('pointermove event target: ' + event.currentTarget);

        if ( INTERSECTED.material.length == 6 ) {
            return;
        }
        
        for ( let i = 0; i < paintingIDs.length; i++ ) {
            if ( INTERSECTED.id == paintingIDs[i].id ) {

                container.style.cursor = 'help';
                // INTERSECTED.material.emissive.setHex( 0xff0000 );
                break;

            }
            
        }
        for ( let i = 0; i < labelIDs.length; i++ ) {
            if ( INTERSECTED.id == labelIDs[i].id ) {

                container.style.cursor = 'help';
                // INTERSECTED.material.emissive.setHex( 0xff0000 );
                break;
                
            }
            
        }
    } else {
        container.style.cursor = '';
    }

}

function onWindowResize() {
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

// Creates a loop that causes the renderer to draw the scene every time the screen is refreshed 
// (on a typical screen this means 60 times per second).
requestAnimationFrame(function render( timestamp ) {

    if ( !infoPanelOn && !fontPanelOn ) {

        controls.update(timestamp);

    }

    if ( infoPanelOn ) {
        
        instructions.style.display = '';
        blocker.style.display = '';
        info_button.style.display = 'none';
        control_container.style.display = 'none';

    } else {

        instructions.style.display = 'none';
        blocker.style.display = 'none';
        info_button.style.display = '';
        control_container.style.display = '';

    }

    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;

    // stats.update();

    renderer.render(scene, camera);
    requestAnimationFrame(render);

    // detect selection
    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera( pointer, camera );

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects( scene.children, false );
    // console.log(intersects.length);
    if ( intersects.length > 0 ) {
        
        if ( INTERSECTED != intersects[0].object ) {
            
            if ( INTERSECTED && INTERSECTED.material.length == 1 ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

            INTERSECTED = intersects[0].object;
            if (INTERSECTED.material.length == 1) {
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                INTERSECTED.material.emissive.setHex( 0x0000ff );
            }
            
        }
    } else {
        if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
        INTERSECTED = null;
    }
});

function setUpFolders() {
    // create folders
    const folder_count = painting_counts.length;
    
    let x = -20, y = 1, z = 0;
    let i = 0;

    for(let j = 0; j < 3; j ++) {
        z = 0 - j * 5;
        for (let k = 0; k < 5; k++) {
            x = -20 + k * 10;
            if (i < folder_count) {
                createFolder(x, y, z, i);
                setUpPaintings(x, y, z, i);
            } else {
                break;
            }
            i++;
        } 
    }
}

function setUpPaintings(x, y, z, i) {

    let painting_count = painting_counts[i];

    let front_wall = { x: x - 1.8, y: y - 1, z: z - 2.35 };
    let back_wall = { x: x - 6.4, y: y - 1, z: z - 1.15 };

    for(let j = 0; j < Math.min(5, painting_count); j++) {
        const geometry = new THREE.PlaneGeometry(0.5, 0.5);
        const material = new THREE.MeshLambertMaterial({ map: new THREE.TextureLoader().load(`asset/painting/${ i + 1 }-${ j + 1 }.png`), transparent: true,  });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(front_wall.x + j * 0.9, front_wall.y, front_wall.z);
        paintingIDs.push({ id: mesh.id, url: `${ i + 1 }-${ j + 1 }.png` });

        scene.add(mesh);
    }

    if (painting_count > 5) {
        for(let j = 5; j < painting_count; j++) {
            const geometry = new THREE.PlaneGeometry(0.5, 0.5);
            const material = new THREE.MeshLambertMaterial({ map: new THREE.TextureLoader().load(`asset/painting/${ i + 1 }-${ j + 1 }.png`), transparent: true,  });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.y -= Math.PI;
            mesh.position.set(back_wall.x + j * 0.9, back_wall.y, back_wall.z);
            paintingIDs.push({ id: mesh.id, url: `${ i + 1 }-${ j + 1 }.png` });
    
            scene.add(mesh);
        }
    }
}

function createFolder(x, y, z, label) {

    console.log("Creating folder " + label);
    const folderLoader = new GLTFLoader();

    folderLoader.load( 'model/1203-wide.glb', function ( gltf ) {
        gltf.scene.rotation.y -= Math.PI / 2;
        gltf.scene.position.set(x, y, z);
        scene.add( gltf.scene );

    }, undefined, function ( error ) {

        console.error( error );

    } );

    // Create a folder label
    // Create a new canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set the canvas size
    canvas.width = 232;
    canvas.height = 40;

    // Create an SVG image
    const svgImage = new Image();
    const svgString = `<svg xmlns="./asset/label/${label}.svg" width="232" height="40">label</svg>`;
    const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf8'});
    const url = URL.createObjectURL(svgBlob);

    svgImage.onload = () => {
        // Draw the SVG onto the canvas
        ctx.drawImage(svgImage, 0, 0);
        // const url = svgImage.src.substring(34);

        // Use the canvas as the source for a texture
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        // Create material with this texture
        const material = new THREE.MeshLambertMaterial({ map: texture });

        // Create a mesh and add it to the scene
        const geometry = new THREE.PlaneGeometry(3, 0.5);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y - 1.2, z - 1);
        labelIDs.push({ id: mesh.id, url: `${label + 1}.png` });
        console.log("Creating label. id: " + mesh.id + "; url: " + label);
        console.log("Creating label. id: " + mesh.id + "; url: " + url);
        scene.add(mesh);
    }
    console.log(labelIDs);

    svgImage.src = `./asset/label/${label}.svg`;
    
}
