export function turn(THREE, scene, dynamicObjects, camera, jolt, physicsSystem, player, bodyInterface, deltaTime){

  //if(player.state.init){
  //}

  if(player.input.clickedLeft){
    if(player.state.projectiles.length > 0){
      let id = player.state.projectiles[0].threeObject.userData.body.GetID();
      bodyInterface.RemoveBody(id);
      bodyInterface.DestroyBody(id);
      delete player.state.projectiles[0].threeObject.userData.body;
      scene.remove(player.state.projectiles[0].threeObject);
    }

    let shape = new Jolt.BoxShape(new Jolt.Vec3(.15, .15, .15), 0.05, null);
    let creationSettings = new Jolt.BodyCreationSettings(
        shape,
        new Jolt.Vec3(camera.position.x, camera.position.y, camera.position.z),
        Jolt.Quat.prototype.sIdentity(), 
        Jolt.EMotionType_Kinematic, 
        1
    );
    let body = bodyInterface.CreateBody(creationSettings);

    Jolt.destroy(creationSettings);
    body.SetIsSensor(true);
    body.SetCollideKinematicVsNonDynamic(true);
    console.log(Jolt);
        //Jolt.PhysicsUpdateContext.CCDBody(body.GetID());   

    bodyInterface.AddBody(body.GetID(), Jolt.EActivation_Activate);



    player.state.projectiles[0] = {};
    let threeObject = getThreeObjectForBody(body, 0xffffff, THREE);
    threeObject.userData.body = body;
    player.state.projectiles[0].threeObject = threeObject;
    scene.add(player.state.projectiles[0].threeObject);



    player.state.projectiles[0].bodyID = body.GetID();
    player.state.projectiles[0].position = bodyInterface.GetPosition(player.state.projectiles[0].bodyID);
    player.state.projectiles[0].active = true;

    player.state.material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    player.state.geometrytest = new THREE.BoxGeometry( .125, .125, .125 );
    player.state.cubec = new THREE.Mesh( player.state.geometrytest, player.state.material );

    player.state.projectiles[0].threeObject.setRotationFromQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));

    let threeQuat = player.state.projectiles[0].threeObject.quaternion;
    let quat = new Jolt.Quat(
      threeQuat._x,
      threeQuat._y,
      threeQuat._z,
      threeQuat._w
    );

    bodyInterface.SetRotation(
      player.state.projectiles[0].bodyID,
      quat,
      Jolt.EActivation_DontActivate
    );
  }

  if(player.input.clickedRight){
  }

  if(player.state.projectiles.length > 0){
    for (var n = 0; n < player.state.contacts.length; n++) {
      if(player.state.contacts[n].body2.GetID().GetIndex() == player.state.projectiles[0].bodyID.GetIndex()){
        //alert('kb');
        player.knockBack(
          player.state.projectiles[0].threeObject.position.x,
          player.state.projectiles[0].threeObject.position.y,
          player.state.projectiles[0].threeObject.position.z,
          3,
          player.input
        );

        player.state.projectiles[0].det = true;

      }
    }

    if(player.state.projectiles[0].det){
      let id = player.state.projectiles[0].threeObject.userData.body.GetID();
      bodyInterface.RemoveBody(id);
      bodyInterface.DestroyBody(id);
      delete player.state.projectiles[0].threeObject.userData.body;
      scene.remove(player.state.projectiles[0].threeObject);
      player.state.projectiles = [];
    } else {
      player.state.projectiles[0].threeObject.translateZ(-.25 * 1000 * deltaTime);

      let joltPosition = new Jolt.RVec3(
        player.state.projectiles[0].threeObject.position.x,
        player.state.projectiles[0].threeObject.position.y,
        player.state.projectiles[0].threeObject.position.z
      );

      bodyInterface.SetPosition(
        player.state.projectiles[0].bodyID,
        joltPosition,
        Jolt.EActivation_DontActivate
      );
      player.state.projectiles[0].position = bodyInterface.GetPosition(player.state.projectiles[0].bodyID);
    }
  }
}

function getThreeObjectForBody(body, color, THREE) {
  let material = new THREE.MeshPhongMaterial({ color: color });
  const wrapVec3 = (v) => new THREE.Vector3(v.GetX(), v.GetY(), v.GetZ());
  const wrapQuat = (q) => new THREE.Quaternion(q.GetX(), q.GetY(), q.GetZ(), q.GetW());

  let threeObject;
  let shape = body.GetShape();
  switch (shape.GetSubType()) {
    case Jolt.EShapeSubType_Box:
      let boxShape = Jolt.castObject(shape, Jolt.BoxShape);
      let extent = wrapVec3(boxShape.GetHalfExtent()).multiplyScalar(2);
      threeObject = new THREE.Mesh(new THREE.BoxGeometry(extent.x, extent.y, extent.z, 1, 1, 1), material);
      break;
    case Jolt.EShapeSubType_Sphere:
      let sphereShape = Jolt.castObject(shape, Jolt.SphereShape);
      threeObject = new THREE.Mesh(new THREE.SphereGeometry(sphereShape.GetRadius(), 32, 32), material);
      break;
    case Jolt.EShapeSubType_Capsule:
      let capsuleShape = Jolt.castObject(shape, Jolt.CapsuleShape);
      threeObject = new THREE.Mesh(new THREE.CapsuleGeometry(capsuleShape.GetRadius(), 2 * capsuleShape.GetHalfHeightOfCylinder(), 20, 10), material);
      break;
    case Jolt.EShapeSubType_Cylinder:
      let cylinderShape = Jolt.castObject(shape, Jolt.CylinderShape);
      threeObject = new THREE.Mesh(new THREE.CylinderGeometry(cylinderShape.GetRadius(), cylinderShape.GetRadius(), 2 * cylinderShape.GetHalfHeight(), 20, 1), material);
      break;
    default:
      threeObject = new THREE.Mesh(createMeshForShape(shape), material);
      break;
  }

  threeObject.position.copy(wrapVec3(body.GetPosition()));
  threeObject.quaternion.copy(wrapQuat(body.GetRotation()));

  return threeObject;
}

function removeFromScene(threeObject, bodyInterface, scene) {
  let id = threeObject.userData.body.GetID();
  bodyInterface.RemoveBody(id);
  bodyInterface.DestroyBody(id);
  delete threeObject.userData.body;

  scene.remove(threeObject);
}
