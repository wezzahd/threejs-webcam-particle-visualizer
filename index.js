window.addEventListener('load', init); // Wait for loading
window.addEventListener('resize', onResize); // When window resized

let renderer, scene, camera;
let webCam;
let particles;
let material;
let time = 0;
let img;

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
    camera.position.set( 0, 20, 0 );
    controls.update(); // must be called after any manual changes to the camera's transform
    scene.add(camera);

    // Create light
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    scene.add(directionalLight);

    // Init webcam & particle
    // getDevices()
    //initWebCam();
    initImage();
    getImageData(img);

    // Render loop
    const render = () => {

      time += 0.005;

        drawParticles();
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
            time: {
                type: 'f',
                value: 0
            },
            size: {
                type: 'f',
                value: 5.0
            },
            // texture: {
            //     type: 't',
            //     value: hoge
            // }
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
        material.uniforms.time.value = time;

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
uniform float time;
uniform float size;
varying vec3 vColor;
varying float vGray;


vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i); // Avoid truncation effects in permutation
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}




void main() {




    // vec3 distortion = curlNoise(vec3(
    //   position.x + time,
    //   position.y + time,
    //   position.z + time));

    float a = 0.0;
     float DF = 0.0;
     vec2 pos = mod(position.xz,3.0);
  vec2 vel = vec2(time*.1);
  DF += snoise(pos + vel)*.25+.25;

  // Add a random position
  a = snoise(pos*vec2(cos(time*0.15),sin(time*0.1))*0.1)*3.1415;
  vel = vec2(cos(a),sin(a));
  DF += snoise(pos+vel)*.25+.25;

vec3 distortion = vec3(
  0.,
  0.,
  smoothstep(0.1,0.9,fract(DF)) );

      float timer = abs(sin(time));

    vec3 finalPosition = position + (vec3(1.0)* distortion);


    vec4 mvPosition = modelViewMatrix * vec4(finalPosition,1.0);


    // Set vertex size
    //gl_PointSize = size * vGray * 3.0;
    gl_PointSize = size;

    // To fragmentShader
    vColor = color;
    float vBrightness = (vColor.x + vColor.y + vColor.z) / 3.0;
    vGray = 1.0;//mix(1.0, 0.1, timer);

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

    // Set vertex color
    gl_FragColor = vec4(vColor, gray);
}
`;
