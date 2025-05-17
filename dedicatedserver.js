export class DedicatedServer {
  constructor(io, initJolt, THREE, Ent, GLTFLoader){

    const loader = new GLTFLoader();
    this.list = [];
    var scene = new THREE.Scene();

    // Timers
    var past = 0;

    // Physics variables
    var jolt;
    var physicsSystem;
    var bodyInterface;

    // List of objects spawned
    var dynamicObjects = [];

    // The update function
    var onExampleUpdate

    const DegreesToRadians = (deg) => deg * (Math.PI / 180.0);

    const wrapVec3 = (v) => new THREE.Vector3(v.GetX(), v.GetY(), v.GetZ());
    const unwrapVec3 = (v) => new Jolt.Vec3(v.x, v.y, v.z);
    const wrapQuat = (q) => new THREE.Quaternion(q.GetX(), q.GetY(), q.GetZ(), q.GetW());
    const unwrapQuat = (q) => new Jolt.Quat(q.x, q.y, q.z, q.w);

    // Object layers
    const LAYER_NON_MOVING = 0;
    const LAYER_MOVING = 1;
    const NUM_OBJECT_LAYERS = 2;


    io.listen(3000) // default port is 9208

    io.onConnection(channel => {

      channel.ent = new Ent(THREE);
      this.list.push(channel);
      io.room(channel.roomId).emit('chat message', {a: this.list.length});
      channel.emit('chat message', 'aaaaaaaaa');
      //channel.emit('chat message', this.list(this.list.length).ent);
      channel.emit('chat message', this.list.pop().ent);

      //for (var x = 0; x < list.length; x++){
        //io.room(channel.roomId).emit('chat message', list[x].userData.name);
      //}


      channel.onDisconnect(() => {
        console.log(`${channel.id} got disconnected`);
        io.room(channel.roomId).emit('chat message', channel.id + ' got disconnected');
        if (this.list[this.list.indexOf(channel)]){
          this.list.splice(this.list.indexOf(channel),1);
        }
      })

      channel.on('chat message', data => {
        console.log(`got chat ${data} from "chat message"`)
        // emit the "chat message" data to all channels in the same room
        io.room(channel.roomId).emit('chat message', data)
      })
      channel.on('name', data => {
        console.log(`got name ${data} from "chat message"`)
        // emit the "chat message" data to all channels in the same room
        //for (var x = 0; x < list.length && x != list.indexOf(channel); x++){
          //while (list[x][userData]['name'].toLowerCase() === data.toLowerCase()){
            //data = data + Math.floor(Math.random() * (9 - 1 + 1) + 1);
          //};
        //};
        channel.userData = {name: data};
        io.room(channel.roomId).emit('chat message', channel.userData.name);
      })
    })

    function initGraphics() {

    }

    let setupCollisionFiltering = function (Jolt, settings) {
      // Layer that objects can be in, determines which other objects it can collide with
      // Typically you at least want to have 1 layer for moving bodies and 1 layer for static bodies, but you can have more
      // layers if you want. E.g. you could have a layer for high detail collision (which is not used by the physics simulation
      // but only if you do collision testing).
      let objectFilter = new Jolt.ObjectLayerPairFilterTable(NUM_OBJECT_LAYERS);
      objectFilter.EnableCollision(LAYER_NON_MOVING, LAYER_MOVING);
      objectFilter.EnableCollision(LAYER_MOVING, LAYER_MOVING);

      // Each broadphase layer results in a separate bounding volume tree in the broad phase. You at least want to have
      // a layer for non-moving and moving objects to avoid having to update a tree full of static objects every frame.
      // You can have a 1-on-1 mapping between object layers and broadphase layers (like in this case) but if you have
      // many object layers you'll be creating many broad phase trees, which is not efficient.
      const BP_LAYER_NON_MOVING = new Jolt.BroadPhaseLayer(0);
      const BP_LAYER_MOVING = new Jolt.BroadPhaseLayer(1);
      const NUM_BROAD_PHASE_LAYERS = 2;
      let bpInterface = new Jolt.BroadPhaseLayerInterfaceTable(NUM_OBJECT_LAYERS, NUM_BROAD_PHASE_LAYERS);
      bpInterface.MapObjectToBroadPhaseLayer(LAYER_NON_MOVING, BP_LAYER_NON_MOVING);
      bpInterface.MapObjectToBroadPhaseLayer(LAYER_MOVING, BP_LAYER_MOVING);

      settings.mObjectLayerPairFilter = objectFilter;
      settings.mBroadPhaseLayerInterface = bpInterface;
      settings.mObjectVsBroadPhaseLayerFilter = new Jolt.ObjectVsBroadPhaseLayerFilterTable(settings.mBroadPhaseLayerInterface, NUM_BROAD_PHASE_LAYERS, settings.mObjectLayerPairFilter, NUM_OBJECT_LAYERS);
    };

    function initPhysics(Jolt) {

      // Initialize Jolt
      let settings = new Jolt.JoltSettings();
      setupCollisionFiltering(Jolt, settings);
      jolt = new Jolt.JoltInterface(settings);
      Jolt.destroy(settings);
      physicsSystem = jolt.GetPhysicsSystem();
      bodyInterface = physicsSystem.GetBodyInterface();

      // Helper functions
      Jolt.Vec3.prototype.ToString = function () { return `(${this.GetX()}, ${this.GetY()}, ${this.GetZ()})` };
      Jolt.Vec3.prototype.Clone = function () { return new Jolt.Vec3(this.GetX(), this.GetY(), this.GetZ()); };
      Jolt.Quat.prototype.ToString = function () { return `(${this.GetX()}, ${this.GetY()}, ${this.GetZ()}, ${this.GetW()})` };
      Jolt.Quat.prototype.Clone = function () { return new Jolt.Vec3(this.GetX(), this.GetY(), this.GetZ(), this.GetW()); };
      Jolt.AABox.prototype.ToString = function () { return `[${this.mMax.ToString()}, ${this.mMin.ToString()}]`; };

    }

    function initExample(Jolt, updateFunction) {
      initGraphics();
      initPhysics(Jolt);
      //setImmediate(function() {})
    }

    initJolt().then(function (Jolt) {
          console.log('init');

          loader.load('public/map.glb', (gltf) => {
            console.log(gltf.scene.children);
            initExample(Jolt, null);
            //scene.add( gltf.scene );


          for (var m = 0; m < gltf.scene.children.length; m++) {

              if(gltf.scene.children[m].name.slice(-4) === '-col'){

                if(!gltf.scene.children[m].children.length > 0){
                  gltf.scene.children[m].children[0] = gltf.scene.children[m];
                }

                for (var w = 0; w < gltf.scene.children[m].children.length; w++) {
                      let vertex = gltf.scene.children[m].children[w].geometry.attributes.position;
                      let index = gltf.scene.children[m].children[w].geometry.index;
                      let j, i, ref;

                      let triangles = new Jolt.TriangleList();

                      for (i = j = 0, ref = index.count /  3; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
                        triangles.push_back(new Jolt.Triangle(
                        new Jolt.Vec3(vertex.getX(index.getX(i*3)), vertex.getY(index.getX(i*3)), vertex.getZ(index.getX(i*3))),
                        new Jolt.Vec3(vertex.getX(index.getY(i*3)), vertex.getY(index.getY(i*3)), vertex.getZ(index.getY(i*3))),
                        new Jolt.Vec3(vertex.getX(index.getZ(i*3)), vertex.getY(index.getZ(i*3)), vertex.getZ(index.getZ(i*3)))
                      ));
                  }

                  let shape = new Jolt.MeshShapeSettings(triangles).Create().Get();
                  Jolt.destroy(triangles);

                  // Create body
                  let creationSettings = new Jolt.BodyCreationSettings(shape, new Jolt.Vec3(0, 0, 0), new Jolt.Quat(0, 0, 0, 1), Jolt.EMotionType_Static, LAYER_NON_MOVING);
                  let body = bodyInterface.CreateBody(creationSettings);
                  Jolt.destroy(creationSettings);
                  bodyInterface.AddBody(body.GetID(), Jolt.EActivation_Activate);
                }
              }

          }

          setup();
          });
          var setup = function(){console.log('111');};

/*
      loader.load(
        'public/map.glb',
        // called when the resource is loaded
        function ( gltf ) {/*
          console.log('loaded');
          initExample(Jolt, null);
          scene.add( gltf.scene );

          for (var m = 0; m < gltf.scene.children.length; m++) {

              if(gltf.scene.children[m].name.slice(-4) === '-col'){

                if(!gltf.scene.children[m].children.length > 0){
                  gltf.scene.children[m].children[0] = gltf.scene.children[m];
                }

                for (var w = 0; w < gltf.scene.children[m].children.length; w++) {
                      let vertex = gltf.scene.children[m].children[w].geometry.attributes.position;
                      let index = gltf.scene.children[m].children[w].geometry.index;
                      let j, i, ref;

                      let triangles = new Jolt.TriangleList();

                      for (i = j = 0, ref = index.count /  3; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
                        triangles.push_back(new Jolt.Triangle(
                        new Jolt.Vec3(vertex.getX(index.getX(i*3)), vertex.getY(index.getX(i*3)), vertex.getZ(index.getX(i*3))),
                        new Jolt.Vec3(vertex.getX(index.getY(i*3)), vertex.getY(index.getY(i*3)), vertex.getZ(index.getY(i*3))),
                        new Jolt.Vec3(vertex.getX(index.getZ(i*3)), vertex.getY(index.getZ(i*3)), vertex.getZ(index.getZ(i*3)))
                      ));
                  }

                  let shape = new Jolt.MeshShapeSettings(triangles).Create().Get();
                  Jolt.destroy(triangles);

                  // Create body
                  let creationSettings = new Jolt.BodyCreationSettings(shape, new Jolt.Vec3(0, 0, 0), new Jolt.Quat(0, 0, 0, 1), Jolt.EMotionType_Static, LAYER_NON_MOVING);
                  let body = bodyInterface.CreateBody(creationSettings);
                  Jolt.destroy(creationSettings);
                  bodyInterface.AddBody(body.GetID(), Jolt.EActivation_Activate);
                }
              }

          }

          setup();
        },
        // called while loading is progressing
        function ( xhr ) {
        },
        // called when loading has errors
        function ( error ) {
          console.log( 'An error happened: ' + error );
        }
      )
    
      var setup = function(){console.log('111');};
*/
    });


  }
}