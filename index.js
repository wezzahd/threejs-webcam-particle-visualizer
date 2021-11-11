window.addEventListener('load', init); // Wait for loading
window.addEventListener('resize', onResize); // When window resized

let renderer, scene, camera;
let webCam;
let particles;
let material;
let time = 0;
let img;
let heightMap;

function init() {
    // Get window size
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Create webgl renderer
    renderer = new THREE.WebGLRenderer({
      // preserveDrawingBuffer: true,
        canvas: document.querySelector('#myCanvas'),
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(windowWidth, windowHeight);
// renderer.autoClearColor = false

    // renderer.outputEncoding = THREE.GammaEncoding;

    // Create scene
    scene = new THREE.Scene();

    // Create camera
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    const controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;
    //camera.position.set( 0, 20, 0 );

    camera.position.z = 0.6;
    camera.position.y = 0.2;
    camera.rotation.x = -0.45;
    controls.update(); // must be called after any manual changes to the camera's transform
    scene.add(camera);

    // Create light
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    scene.add(directionalLight);

//Displacement map
 heightMap = THREE.ImageUtils.loadTexture("data:image/png;base64,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");

heightMap.wrapT = heightMap.wrapS = THREE.RepeatWrapping;


    // Init webcam & particle
    // getDevices()
    //initWebCam();
    initImage();
    getImageData(img);

    // Render loop
    const render = () => {

      time += 0.005;

        drawParticles();
        particles.rotation.y = time ;
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    };
    render();
}

function initImage(){
img = document.createElement('img');
img.src = 'flow_insta.jpg';
//img.id = 'image';
img.width = 640;
img.height = 640;
createParticles();
}

// Get videoinput device info
function getDevices(){
    console.log("getDevices...");
    navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
        devices.forEach(function(device) {
            if(device.kind == "videoinput"){
                console.log("device:",device);
            }
        });
    })
    .catch(function(err) {
        console.error('ERROR:', err);
    });
}

function initWebCam(){
    console.log("initWebCam...");
    webCam = document.createElement('video');
    webCam.id = 'webcam';
    webCam.autoplay = true;
    webCam.width    = 640;
    webCam.height   = 480;

    const option = {
        video: true,
        // video: {
        //     deviceId: "hogehoge",
        //     width: { ideal: 1280 },
        //     height: { ideal: 720 }
        // },
        audio: false,
    }

    // Get image from camera
    media = navigator.mediaDevices.getUserMedia(option)
    .then(function(stream) {
        webCam.srcObject = stream;
        createParticles();
    }).catch(function(e) {
        alert("ERROR: " + e.message);
        // console.error('ERROR:', e.message);
    });
}

function getImageData(image){

    const w = image.width;
    const h = image.height;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = w;
    canvas.height = h;

    // // Invert image
    // ctx.translate(w, 0);
    // ctx.scale(-1, 1);

    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);

    return imageData
}

function createParticles(){
    console.log("createParticles...");
    //const imageData = getImageData(webCam);
    const imageData = getImageData(img);

    const geometry = new THREE.BufferGeometry();
    const vertices_base = [];
    const colors_base = [];

    const width = imageData.width;
    const height = imageData.height;

    // Set particle info
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const posX = 0.03*(-x + width / 2);
            const posY = 0; //0.1*(-y + height / 2)
            const posZ = 0.03*(y - height / 2);
            vertices_base.push(posX, posY, posZ);

            const r = 1.0;
            const g = 1.0;
            const b = 1.0;
            colors_base.push(r, g, b);
        }
    }
    const vertices = new Float32Array(vertices_base);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const colors = new Float32Array(colors_base);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Set shader material
     material = new THREE.ShaderMaterial({
        uniforms: {
            u_time: {
                type: 'f',
                value: 0
            },
            size: {
                type: 'f',
                value: 5.0
            },
            u_heightMap: {
                type: 't',
                value: heightMap
            }

        },
        vertexShader: vertexSource,
        fragmentShader: fragmentSource,
        transparent: true,
        depthWrite: false,
        // blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function drawParticles(t){
    // Update particle info
    if (particles) {
        const imageData = getImageData(img);
        const length = particles.geometry.attributes.position.count;
        for (let i = 0; i < length; i++) {
            const index = i * 4;
            const r = imageData.data[index]/255;
            const g = imageData.data[index+1]/255;
            const b = imageData.data[index+2]/255;
            const gray = (r+g+b) / 3;

            particles.geometry.attributes.position.setY( i , 1.0);
            particles.geometry.attributes.color.setX( i , r);
            particles.geometry.attributes.color.setY( i , g);
            particles.geometry.attributes.color.setZ( i , b);

        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.color.needsUpdate = true;

        material.uniforms.u_time.value = time;

    }
}

function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

//===================================================
// Shader Souce
//===================================================

const vertexSource = `
attribute vec3 color;
attribute vec2 aTexCoord;
uniform float u_time;
uniform float size;
uniform lowp sampler2D u_heightMap;
varying vec3 vColor;
varying float vGray;



void main() {

        vec3 pos = position * 0.04;
        vec2 offset1 = vec2(0.5, 1.) * u_time * 0.1;
        vec2 offset2 = vec2(0., 0.5) * u_time * 0.1;
        vec2 offset3 = vec2(0., 1.0) * u_time * 0.1;
        float hight1 = texture2D(u_heightMap, pos.x + offset1).r * 0.03;
        float hight2 = texture2D(u_heightMap, pos.z + offset2).r * 0.03;
        float hight3 = texture2D(u_heightMap, pos.y + offset3).r * 0.03;
        pos.y += (hight1 + hight2 + hight3);
        pos.z += (hight1 + hight2 + hight3);
        //pos.x += (hight1 * hight2 * hight3);
		    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

    //
    // vec3 distortion = curlNoise(vec3(
    //   position.x + time,
    //   position.y + time,
    //   position.z + time));
    //
     float timer = abs(sin(u_time));
    //
    // vec3 finalPosition = position + (vec3(timer)* distortion);
    //
    //
    // vec4 mvPosition = modelViewMatrix * vec4(finalPosition,1.0);
    //
    //
    // // Set vertex size
    // //gl_PointSize = size * vGray * 3.0;
     //gl_PointSize = 2.0;

    // To fragmentShader
    vColor = color;
    float vBrightness = (vColor.x + vColor.y + vColor.z) / 3.0;
    vGray = 1.0;

    // Set vertex position
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentSource = `
varying vec3 vColor;
varying float vGray;
void main() {
    float gray = vGray;

    // // Decide whether to draw particle
  if(vColor.x <= 0.){
         gray = 0.0;
     // }else{
     //     gray = 1.0;
     }

vec3 col = vec3(0.,1.,1.0);

    // Set vertex color
    gl_FragColor = vec4(vColor,vGray);
}
`;
